import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Encryption } from '@/lib/encryption'
import path from 'path'
import fs from 'fs'

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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Restoring snapshot', { snapshotId: params.id })

    // Get the current user's encryption salt
    const user = await prisma.user.findFirst()
    if (!user?.encryptionSalt) {
      throw new Error('No encryption salt found')
    }

    // Get password from request
    const { password } = await req.json()
    if (!password) {
      throw new Error('Password is required')
    }

    // Initialize encryption with user's password and salt
    await Encryption.initialize(password, user.encryptionSalt)

    // Read snapshot file
    const snapshotPath = path.join(process.cwd(), 'snapshots', params.id)
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))

    // Get the data from the correct location based on schema version
    const data = snapshot.version ? snapshot.data : snapshot

    await prisma.$transaction(async (tx) => {
      // Clear existing data
      await tx.note.deleteMany()
      await tx.quote.deleteMany()
      await tx.item.deleteMany()
      await tx.group.deleteMany()
      await tx.settings.deleteMany()

      // Restore settings if present
      if (data.settings) {
        const cleanSettings = cleanDataForPrisma(data.settings)
        await tx.settings.create({ data: cleanSettings })
      }

      // Restore groups first (for foreign key constraints)
      if (data.groups?.length) {
        for (const group of data.groups) {
          const cleanGroup = cleanDataForPrisma(group)
          await tx.group.create({ data: cleanGroup })
        }
      }

      // Restore items
      if (data.items?.length) {
        for (const item of data.items) {
          const cleanItem = cleanDataForPrisma(item)
          await tx.item.create({ data: cleanItem })
        }
      }

      // Restore quotes
      if (data.quotes?.length) {
        for (const quote of data.quotes) {
          const cleanQuote = cleanDataForPrisma(quote)
          await tx.quote.create({ data: cleanQuote })
        }
      }

      // Restore notes
      if (data.notes?.length) {
        for (const note of data.notes) {
          const cleanNote = cleanDataForPrisma(note)
          await tx.note.create({ data: cleanNote })
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