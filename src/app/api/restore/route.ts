import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const snapshot = await req.json()

    // Validate snapshot format
    if (!snapshot.version || !snapshot.schema || !snapshot.data) {
      throw new Error('Invalid snapshot format')
    }

    // Clear existing data in correct order (respect foreign keys)
    await prisma.$transaction([
      prisma.message.deleteMany(),
      prisma.mailbox.deleteMany(),
      prisma.note.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.item.deleteMany(),
      prisma.group.deleteMany(),
      prisma.settings.deleteMany(),
      prisma.user.deleteMany()
    ])

    // Clean up data before restore
    const cleanItems = snapshot.data.items.map((item: any) => {
      const { group, ...cleanItem } = item
      return cleanItem
    })

    // Restore data in correct order (respect foreign keys)
    await prisma.$transaction([
      // First restore independent tables
      prisma.settings.create({ 
        data: snapshot.data.settings || {} 
      }),
      ...snapshot.data.quotes.map((quote: any) => 
        prisma.quote.create({ data: quote })
      ),
      ...snapshot.data.notes.map((note: any) => 
        prisma.note.create({ data: note })
      ),

      // Then restore tables with relationships
      ...snapshot.data.groups.map((group: any) => 
        prisma.group.create({ data: group })
      ),
      ...cleanItems.map((item: any) => 
        prisma.item.create({ data: item })
      ),

      // Finally restore email-related tables if they exist
      ...(snapshot.schema.includesEmail ? [
        ...snapshot.data.mailboxes.data.map((mailbox: any) => 
          prisma.mailbox.create({ data: mailbox })
        ),
        ...snapshot.data.messages.data.map((message: any) => 
          prisma.message.create({ data: message })
        )
      ] : [])
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json(
      { error: 'Failed to restore from backup' },
      { status: 500 }
    )
  }
} 