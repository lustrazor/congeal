import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  try {
    // Create snapshots directory if it doesn't exist
    const snapshotsDir = path.join(process.cwd(), 'snapshots')
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true })
    }

    // Get all data
    const [settings, groups, items, quotes, notes] = await prisma.$transaction([
      prisma.settings.findFirst(),
      prisma.group.findMany(),
      prisma.item.findMany(),
      prisma.quote.findMany(),
      prisma.note.findMany()
    ])

    // Build snapshot data
    const snapshot = {
      version: '1.1.0',
      schema: {
        includesNotes: true,
        includesQuotes: true,
        includesEmail: true
      },
      data: {
        settings,
        groups,
        items,
        quotes,
        notes
      },
      createdAt: new Date().toISOString()
    }

    // Save snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_')
    const filename = `snapshot-${timestamp}.json`
    const filePath = path.join(snapshotsDir, filename)

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2))

    return NextResponse.json({ success: true, filename })
  } catch (error) {
    console.error('Failed to create snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const snapshotsDir = path.join(process.cwd(), 'snapshots')
    const files = fs.readdirSync(snapshotsDir)
    const snapshots = files
      .filter(f => f.endsWith('.json'))
      .map(filename => {
        // Extract timestamp from filename (format: snapshot-2025-01-31T17_09_16.json)
        const timestamp = filename
          .replace('snapshot-', '')
          .replace('.json', '')
          .replace(/_/g, ':')
        
        return {
          id: filename,
          createdAt: new Date(timestamp).toISOString()
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Failed to list snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to list snapshots' },
      { status: 500 }
    )
  }
} 