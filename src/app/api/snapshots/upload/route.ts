import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

export async function POST(req: NextRequest) {
  try {
    // Try to parse as JSON first, fallback to FormData
    let snapshot
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      snapshot = await req.json()
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) {
        throw new Error('No file uploaded')
      }
      snapshot = JSON.parse(await file.text())
    }

    console.log('Received snapshot:', {
      hasVersion: !!snapshot.version,
      hasSchema: !!snapshot.schema,
      hasData: !!snapshot.data,
      version: snapshot.version,
      schema: snapshot.schema,
      dataKeys: Object.keys(snapshot.data || {})
    })

    // Get the data from the correct location based on schema version
    const data = snapshot.version ? snapshot.data : snapshot

    await prisma.$transaction(async (tx) => {
      // Clear existing data
      await tx.message.deleteMany()
      await tx.mailbox.deleteMany()
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
        console.log('Restoring groups...')
        for (const group of data.groups) {
          const cleanGroup = cleanDataForPrisma(group)
          await tx.group.create({ data: cleanGroup })
        }
      }

      // Restore items
      if (data.items?.length) {
        console.log('Restoring items...')
        for (const item of data.items) {
          const cleanItem = cleanDataForPrisma(item)
          await tx.item.create({ data: cleanItem })
        }
      }

      // Restore quotes
      if (data.quotes?.length) {
        console.log('Restoring quotes...')
        for (const quote of data.quotes) {
          const cleanQuote = cleanDataForPrisma(quote)
          await tx.quote.create({ data: cleanQuote })
        }
      }

      // Restore notes
      if (data.notes?.length) {
        console.log('Restoring notes...')
        for (const note of data.notes) {
          const cleanNote = cleanDataForPrisma(note)
          await tx.note.create({ data: cleanNote })
        }
      }

      // Restore email data if present in schema
      if (snapshot.schema?.includesEmail) {
        if (data.mailboxes?.length) {
          console.log('Restoring mailboxes...')
          for (const mailbox of data.mailboxes) {
            const cleanMailbox = cleanDataForPrisma(mailbox)
            await tx.mailbox.create({ data: cleanMailbox })
          }
        }
        if (data.messages?.length) {
          console.log('Restoring messages...')
          for (const message of data.messages) {
            const cleanMessage = cleanDataForPrisma(message)
            await tx.message.create({ data: cleanMessage })
          }
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Failed to restore from backup' },
      { status: 500 }
    )
  }
} 