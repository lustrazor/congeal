import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

// Helper to clean data before insertion
const cleanDataForPrisma = (data: any) => {
  // Remove _count and other computed fields
  const { _count, ...cleanData } = data
  
  // Convert date strings to Date objects
  if (cleanData.createdAt) {
    cleanData.createdAt = new Date(cleanData.createdAt)
  }
  if (cleanData.updatedAt) {
    cleanData.updatedAt = new Date(cleanData.updatedAt)
  }
  if (cleanData.dueAt) {
    cleanData.dueAt = cleanData.dueAt ? new Date(cleanData.dueAt) : null
  }
  
  return cleanData
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotId = params.id
    // Remove any extra .json extension that might have been added
    const cleanId = snapshotId.replace(/\.json$/, '')
    const filePath = path.join(process.cwd(), 'snapshots', `${cleanId}.json`)
    
    console.log('Restoring snapshot', { snapshotId })
    
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const snapshot = JSON.parse(fileContent)

    // Begin transaction to restore all data
    await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => {
      // Clear existing data
      await tx.item.deleteMany({})
      await tx.group.deleteMany({})
      await tx.settings.deleteMany({})
      await tx.quote.deleteMany({})
      await tx.note.deleteMany({})
      if (snapshot.schema?.includesEmail) {
        await tx.message.deleteMany({})
        await tx.mailbox.deleteMany({})
      }

      // Get the data from the correct location based on schema version
      const data = snapshot.version ? snapshot.data : snapshot

      // Restore data in correct order (handle foreign key constraints)
      if (data.groups?.length) {
        const cleanGroups = data.groups.map(cleanDataForPrisma)
        await tx.group.createMany({ data: cleanGroups })
      }

      if (data.items?.length) {
        const cleanItems = data.items.map(cleanDataForPrisma)
        await tx.item.createMany({ data: cleanItems })
      }

      if (data.settings) {
        const cleanSettings = cleanDataForPrisma(data.settings)
        await tx.settings.create({ data: cleanSettings })
      }

      if (data.quotes?.length) {
        const cleanQuotes = data.quotes.map(cleanDataForPrisma)
        await tx.quote.createMany({ data: cleanQuotes })
      }

      if (data.notes?.length) {
        const cleanNotes = data.notes.map(cleanDataForPrisma)
        await tx.note.createMany({ data: cleanNotes })
      }

      if (snapshot.schema?.includesEmail) {
        if (data.mailboxes?.length) {
          const cleanMailboxes = data.mailboxes.map(cleanDataForPrisma)
          await tx.mailbox.createMany({ data: cleanMailboxes })
        }
        if (data.messages?.length) {
          const cleanMessages = data.messages.map(cleanDataForPrisma)
          await tx.message.createMany({ data: cleanMessages })
        }
      }
    })

    console.log('Snapshot restored successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json(
      { error: 'Failed to restore snapshot' },
      { status: 500 }
    )
  }
} 