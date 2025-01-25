import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get all data from each table in parallel
    const [users, groups, items, settings, quotes, notes, mailboxes, messages] = await Promise.all([
      prisma.user.findMany({
        select: {
          username: true,
          password: true,
          isAdmin: true,
          encryptionSalt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.group.findMany(),
      prisma.item.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          iconName: true,
          order: true,
          useStatusColor: true,
          dueAt: true,
          groupId: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.settings.findFirst(),
      prisma.quote.findMany(),
      prisma.note.findMany(),
      prisma.mailbox.findMany(),
      prisma.message.findMany()
    ])

    const snapshot = {
      version: "1.0",
      schema: {
        includesEmail: true
      },
      data: {
        groups,
        items,
        settings: settings || {},
        quotes,
        notes,
        mailboxes: {
          data: mailboxes,
          debug: {
            duration: "3ms",
            query: "SELECT main.Mailbox.*, COALESCE(aggr_selection_0_Message._aggr_count_messages, 0) AS _aggr_count_messages \n FROM main.Mailbox \n",
            rowCount: mailboxes.length,
            method: "GET",
            path: "/api/mailboxes"
          }
        },
        messages: {
          data: messages,
          debug: {
            duration: "5ms",
            query: "SELECT * FROM messages",
            rowCount: messages.length
          }
        }
      }
    }

    const timestamp = new Date().toISOString()
    const filename = `snapshot-${timestamp.replace(/[:]/g, '_')}.json`

    return new NextResponse(JSON.stringify(snapshot, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
} 