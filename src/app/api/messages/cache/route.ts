import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

// Add route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CACHE_DIR = path.join(process.cwd(), 'cache')
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mailboxId = searchParams.get('mailboxId')
    const startTime = Date.now()

    if (!mailboxId) {
      return NextResponse.json({ data: [] })
    }

    const cacheFile = path.join(CACHE_DIR, `messages-${mailboxId}.json`)
    if (!fs.existsSync(cacheFile)) {
      return NextResponse.json({ data: [] })
    }

    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
    
    // Check if cache is still valid
    if (startTime - cache.timestamp > CACHE_TTL) {
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({
      data: cache.messages,
      debug: {
        duration: `${Date.now() - startTime}ms`,
        source: 'cache',
        messageCount: cache.messages.length,
        cacheAge: `${Math.round((startTime - cache.timestamp) / 1000)}s`
      }
    })
  } catch (error) {
    console.error('Error reading message cache:', error)
    return NextResponse.json({ data: [] })
  }
} 