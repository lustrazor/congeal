import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

// Helper to validate input
function validateInput(uid: string, mailboxId: any): { 
  valid: boolean, 
  error?: string 
} {
  if (!mailboxId) {
    return { valid: false, error: 'mailboxId is required' }
  }
  
  const parsedUid = parseInt(uid)
  if (isNaN(parsedUid) || parsedUid <= 0) {
    return { valid: false, error: 'Invalid message UID' }
  }

  const parsedMailboxId = parseInt(mailboxId)
  if (isNaN(parsedMailboxId) || parsedMailboxId <= 0) {
    return { valid: false, error: 'Invalid mailbox ID' }
  }

  return { valid: true }
}

export async function POST(
  request: Request,
  { params }: { params: { uid: string } }
) {
  // Debug logging at entry point
  console.log('POST /api/messages/[uid]/seen called:', {
    uid: params.uid,
    url: request.url
  })

  let client: ImapFlow | null = null
  const startTime = Date.now()
  
  try {
    // Input validation
    const { mailboxId } = await request.json()
    const validation = validateInput(params.uid, mailboxId)
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error 
      }, { status: 400 })
    }

    const uid = parseInt(params.uid)
    console.log('Marking message as seen:', { uid, mailboxId })

    // Get mailbox info
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: parseInt(mailboxId) }
    })

    if (!mailbox) {
      return NextResponse.json({ 
        error: 'Mailbox not found' 
      }, { status: 404 })
    }

    // Initialize IMAP client
    try {
      client = new ImapFlow({
        host: mailbox.imapHost,
        port: mailbox.imapPort,
        secure: mailbox.useSSL,
        auth: {
          user: mailbox.username,
          pass: mailbox.password
        },
        logger: false,
        socketTimeout: 10000  // 10 second timeout
      })

      await client.connect()
      console.log('Connected to IMAP server')
    } catch (error) {
      throw new Error(`IMAP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Open mailbox and set flag
    try {
      await client.mailboxOpen('INBOX')
      console.log('Opened INBOX')

      await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
      console.log(`Added \\Seen flag to message ${uid}`)
    } catch (error) {
      throw new Error(`Failed to set message flag: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({ 
      success: true,
      message: `Marked message ${uid} as seen`,
      debug: {
        duration: `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    console.error('Error marking message as seen:', error)
    return NextResponse.json({ 
      error: 'Failed to mark message as seen',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    if (client) {
      try {
        if (client.usable) {
          await client.logout()
        }
        await client.close()
      } catch (error) {
        console.error('Error closing IMAP connection:', error)
      }
    }
  }
} 