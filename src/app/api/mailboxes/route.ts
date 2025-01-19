import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startTime = Date.now()
    const mailboxes = await prisma.mailbox.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    })
    const duration = Date.now() - startTime

    // Add detailed debug info to response
    return NextResponse.json({
      data: mailboxes,
      debug: {
        duration: `${duration}ms`,
        query: `SELECT main.Mailbox.*, COALESCE(aggr_selection_0_Message._aggr_count_messages, 0) AS _aggr_count_messages 
               FROM main.Mailbox 
               LEFT JOIN (
                 SELECT mailboxId, COUNT(*) AS _aggr_count_messages 
                 FROM main.Message 
                 GROUP BY mailboxId
               ) AS aggr_selection_0_Message 
               ON main.Mailbox.id = aggr_selection_0_Message.mailboxId 
               ORDER BY main.Mailbox.order ASC`,
        rowCount: mailboxes.length,
        method: 'GET',
        path: '/api/mailboxes'
      }
    })
  } catch (error) {
    console.error('Error fetching mailboxes:', error)
    return NextResponse.json(
      { error: 'Error fetching mailboxes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const mailbox = await prisma.mailbox.create({
      data: {
        name: data.name,
        iconName: data.iconName,
        iconColor: data.iconColor,
        email: data.email,
        imapHost: data.imapHost,
        imapPort: data.imapPort,
        username: data.username,
        password: data.password,
        useSSL: data.useSSL,
        useOAuth: data.useOAuth
      }
    })

    return NextResponse.json(mailbox)
  } catch (error) {
    console.error('Failed to create mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    const mailbox = await prisma.mailbox.update({
      where: { id: data.id },
      data: {
        name: data.name,
        iconName: data.iconName,
        iconColor: data.iconColor,
        email: data.email,
        imapHost: data.imapHost,
        imapPort: data.imapPort,
        username: data.username,
        password: data.password,
        useSSL: data.useSSL,
        useOAuth: data.useOAuth
      }
    })

    return NextResponse.json(mailbox)
  } catch (error) {
    console.error('Failed to update mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    )
  }
} 