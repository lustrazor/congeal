import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

// Helper to extract content from plain text
function extractPlainTextContent(content: string): string {
  // Look for the first blank line that separates headers from content
  const parts = content.split(/\r?\n\r?\n/)
  if (parts.length > 1) {
    // Return everything after the headers
    return parts.slice(1).join('\n\n').trim()
  }
  return content.trim()
}

// Helper to parse multipart content
function parseMultipartContent(content: string) {
  // Look for multipart boundary
  const boundaryMatch = content.match(/boundary="?([^"\r\n]+)"?/)
  if (!boundaryMatch) {
    // If not multipart, treat as plain text
    return {
      text: extractPlainTextContent(content),
      html: null
    }
  }

  const boundary = boundaryMatch[1]
  const parts = content.split('--' + boundary)
  let text = null
  let html = null

  parts.forEach(part => {
    if (part.includes('Content-Type: text/plain')) {
      // Get text content after headers
      const contentStart = part.indexOf('\r\n\r\n')
      if (contentStart > -1) {
        text = part.slice(contentStart + 4).trim()
      }
    } else if (part.includes('Content-Type: text/html')) {
      // Get HTML content after headers
      const contentStart = part.indexOf('\r\n\r\n')
      if (contentStart > -1) {
        html = cleanHtmlContent(part.slice(contentStart + 4).trim())
      }
    }
  })

  return {
    text: text || '',
    html: html || null
  }
}

// Add this helper function to clean HTML content
function cleanHtmlContent(html: string): string {
  return html
    // Fix encoded quotes and equals signs
    .replace(/=3D/g, '=')
    .replace(/=22/g, '"')
    .replace(/=27/g, "'")
    // Fix line breaks in HTML
    .replace(/=\r?\n/g, '')
    // Fix encoded spaces
    .replace(/=20/g, ' ')
    // Fix other common encodings
    .replace(/=([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)))
}

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  let client: ImapFlow | null = null
  
  try {
    const { searchParams } = new URL(request.url)
    const mailboxId = searchParams.get('mailboxId')
    const uid = parseInt(params.uid)

    if (!mailboxId || isNaN(uid)) {
      return NextResponse.json({ 
        error: 'Invalid UID or Mailbox ID' 
      }, { status: 400 })
    }

    const mailbox = await prisma.mailbox.findUnique({
      where: { id: parseInt(mailboxId) }
    })

    if (!mailbox) {
      return NextResponse.json({ 
        error: 'Mailbox not found' 
      }, { status: 404 })
    }

    client = new ImapFlow({
      host: mailbox.imapHost,
      port: mailbox.imapPort,
      secure: mailbox.useSSL,
      auth: {
        user: mailbox.username,
        pass: mailbox.password
      },
      logger: false
    })

    await client.connect()
    console.log('Connected to IMAP server, fetching message', uid)

    await client.mailboxOpen('INBOX')
    console.log('Opened INBOX')

    // First fetch message structure
    const structure = await client.fetchOne(uid, { 
      bodyStructure: true 
    }, { uid: true })

    console.log('Message Structure:', structure.bodyStructure)

    // Get full message content
    const message = await client.fetchOne(uid, {
      source: true
    }, { uid: true })

    if (!message.source) {
      return NextResponse.json({ 
        error: 'No content found for message' 
      }, { status: 404 })
    }

    // Parse the content
    const fullContent = message.source.toString()
    const { text, html } = parseMultipartContent(fullContent)

    return NextResponse.json({
      content: html || text,  // Prefer HTML if available
      fullContent,  // Keep full content for headers display
      isHtml: !!html
    })

  } catch (error) {
    console.error('Error fetching message content:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch message content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    if (client?.usable) {
      await client.logout().catch(console.error)
    }
  }
}