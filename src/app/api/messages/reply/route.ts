import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

// Add type declaration for ImapFlow
declare module 'imapflow' {
  export class ImapFlow {
    constructor(config: any)
    connect(): Promise<void>
    logout(): Promise<void>
    append(path: string, content: string | Buffer, flags?: string[]): Promise<any>
  }
}

export async function POST(request: Request) {
  try {
    const startTime = Date.now()
    const data = await request.json()
    
    // Get mailbox connection details
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: data.mailboxId }
    })

    if (!mailbox) {
      throw new Error('Mailbox not found')
    }

    // Connect to IMAP server
    const client = new ImapFlow({
      host: mailbox.imapHost,
      port: mailbox.imapPort,
      secure: mailbox.useSSL,
      auth: {
        user: mailbox.username,
        pass: mailbox.password
      }
    })

    await client.connect()

    try {
      // Create email content with proper line endings
      const emailContent = [
        `From: ${mailbox.email}`,
        `To: ${data.to}`,
        `Subject: ${data.subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',  // Empty line between headers and body
        data.body
      ].join('\r\n')

      // Upload the message as a string (not a stream)
      await client.append('INBOX', emailContent, ['\\Seen'])

      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        debug: {
          duration: `${duration}ms`,
          query: `APPEND message to ${mailbox.imapHost}:${mailbox.imapPort}`,
          method: 'POST',
          path: '/api/messages/reply'
        }
      })
    } finally {
      await client.logout()
    }
  } catch (error) {
    console.error('Error sending reply:', error)
    return NextResponse.json(
      { error: 'Failed to send reply' },
      { status: 500 }
    )
  }
} 