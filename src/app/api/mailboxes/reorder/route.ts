import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const startTime = Date.now()
    const { mailboxes } = await request.json()

    // Update all mailboxes in a transaction
    await prisma.$transaction(
      mailboxes.map((mailbox: any) =>
        prisma.mailbox.update({
          where: { id: mailbox.id },
          data: { order: mailbox.order }
        })
      )
    )

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      debug: {
        duration: `${duration}ms`,
        query: 'UPDATE Mailbox SET order = ? WHERE id = ?',
        method: 'POST',
        path: '/api/mailboxes/reorder'
      }
    })
  } catch (error) {
    console.error('Error reordering mailboxes:', error)
    return NextResponse.json(
      { error: 'Failed to reorder mailboxes' },
      { status: 500 }
    )
  }
} 