import { NextResponse } from 'next/server'
import * as ImapFlow from 'imapflow'

export async function POST(request: Request) {
  try {
    const { imapHost, imapPort, username, password } = await request.json()

    // Create IMAP client
    const client = new ImapFlow.ImapFlow({
      host: imapHost,
      port: imapPort,
      secure: true,
      auth: {
        user: username,
        pass: password
      },
      logger: false,
      // Some servers have invalid certificates
      tls: { rejectUnauthorized: false }
    })

    try {
      // Try to connect and authenticate
      await client.connect()
      
      // If we get here, connection was successful
      await client.logout()
      return NextResponse.json({ success: true })
    } finally {
      // Always close the connection
      client.close()
    }

  } catch (error) {
    console.error('IMAP connection test failed:', error)
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 400 }
    )
  }
} 