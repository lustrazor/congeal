import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import path from 'path'
import fs from 'fs'

// Cache directory per mailbox
const CACHE_DIR = path.join(process.cwd(), 'cache')

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

// Add timeout helper
const withTimeout = async (promise: Promise<any>, timeoutMs: number) => {
  let timeoutHandle: NodeJS.Timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutHandle!)
    return result
  } catch (error) {
    clearTimeout(timeoutHandle!)
    throw error
  }
}

export async function GET(request: Request) {
  let client: ImapFlow | null = null
  let lock = null
  
  try {
    const { searchParams } = new URL(request.url)
    const mailboxId = searchParams.get('mailboxId')
    const startTime = Date.now()

    if (mailboxId) {
      const mailbox = await prisma.mailbox.findUnique({
        where: { id: parseInt(mailboxId) }
      })

      if (!mailbox) {
        throw new Error('Mailbox not found')
      }

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

      // Open the mailbox first
      const mailboxInfo = await client.mailboxOpen('INBOX')
      console.log('Opened mailbox:', mailboxInfo.path, 
                 `(${mailboxInfo.exists} messages)`)

      const messages = []
      
      // Set a timeout for the entire fetch operation
      const fetchTimeout = setTimeout(() => {
        if (client?.usable) {
          client.close()
        }
      }, 30000) // 30 second timeout

      try {
        // Only fetch last 50 messages
        const start = Math.max(1, (mailboxInfo.exists || 0) - 49)
        const range = `${start}:*`

        console.log(`Fetching messages ${range}...`)
        
        // Basic fetch with sequence numbers
        for await (let msg of client.fetch(range, { 
          uid: true,
          flags: true,
          envelope: true
        })) {
          // Convert flags to array if it's not already
          const flags = Array.isArray(msg.flags) ? msg.flags : 
                        msg.flags instanceof Set ? Array.from(msg.flags) :
                        typeof msg.flags === 'string' ? [msg.flags] : []

          console.log('Message flags:', {
            uid: msg.uid,
            flags,
            rawFlags: msg.flags
          })

          messages.push({
            id: msg.uid,
            subject: msg.envelope?.subject || '(No subject)',
            from: msg.envelope?.from?.[0]?.address || '',
            date: msg.envelope?.date,
            mailboxId: parseInt(mailboxId),
            body: '',  // Skip body for now
            flags: flags,
            isUnread: !flags.includes('\\Seen'),
            hasHtml: false
          })

          console.log(`Fetched message ${msg.uid}:`, {
            subject: msg.envelope?.subject
          })
        }

        // Cache and return results
        const cacheFile = path.join(CACHE_DIR, `messages-${mailboxId}.json`)
        fs.writeFileSync(cacheFile, JSON.stringify({
          timestamp: Date.now(),
          messages
        }, null, 2))

        return NextResponse.json({
          data: messages,
          debug: {
            duration: `${Date.now() - startTime}ms`,
            query: `FETCH ${messages.length} messages FROM ${mailbox.imapHost}`,
            total: mailboxInfo.exists,
            unseen: mailboxInfo.unseen
          }
        })

      } finally {
        clearTimeout(fetchTimeout)
        if (client?.usable) {
          await client.logout()
        }
      }
    } else {
      // Return local messages if no mailbox selected
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        include: { mailbox: true }
      })

      return NextResponse.json({
        data: messages,
        debug: {
          duration: `${Date.now() - startTime}ms`,
          query: 'SELECT * FROM messages',
          rowCount: messages.length
        }
      })
    }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch messages',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    if (client?.usable) {
      await client.close()
    }
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const message = await prisma.message.create({ data })
    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating message' },
      { status: 500 }
    )
  }
} 