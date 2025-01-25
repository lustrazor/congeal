import { NextResponse } from 'next/server'
import { writeFile, readdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

const SNAPSHOT_LIMIT = 10 // Maximum number of snapshots to keep

// Helper to clean data for snapshot
const prepareDataForSnapshot = (data: any) => {
  // Remove any computed fields or unnecessary data
  const { _count, ...cleanData } = data
  return cleanData
}

export async function POST(request: Request) {
  try {
    // Get existing snapshots
    const snapshotsDir = join(process.cwd(), 'snapshots')
    const files = await readdir(snapshotsDir)
    const snapshots = files.filter(f => f.endsWith('.json'))

    // Check if we've hit the limit
    if (snapshots.length >= SNAPSHOT_LIMIT) {
      return NextResponse.json(
        { error: 'Snapshot limit reached' },
        { status: 400 }
      )
    }

    // Fetch all data
    const [groups, items, settings, quotes, notes] = await Promise.all([
      prisma.group.findMany(),
      prisma.item.findMany(),
      prisma.settings.findFirst(),
      prisma.quote.findMany(),
      prisma.note.findMany(),
    ])

    // Clean data for snapshot
    const snapshotData = {
      version: '1.0',
      schema: {
        includesEmail: false
      },
      data: {
        groups: groups.map(prepareDataForSnapshot),
        items: items.map(prepareDataForSnapshot),
        settings: settings ? prepareDataForSnapshot(settings) : null,
        quotes: quotes.map(prepareDataForSnapshot),
        notes: notes.map(prepareDataForSnapshot)
      }
    }

    // Create new snapshot
    const timestamp = new Date().toISOString()
    const filename = `snapshot-${timestamp.replace(/[:]/g, '_')}.json`
    const path = join(snapshotsDir, filename)

    // Write snapshot
    await writeFile(path, JSON.stringify(snapshotData, null, 2))

    return NextResponse.json({ 
      success: true,
      id: filename,
      createdAt: timestamp
    })
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
    const snapshotsDir = join(process.cwd(), 'snapshots')
    const files = await readdir(snapshotsDir)
    const snapshots = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        // Extract timestamp and convert underscores back to colons for proper date parsing
        const timestamp = f.replace('snapshot-', '').replace('.json', '')
          .replace(/_/g, ':')
        return {
          id: f,
          createdAt: timestamp
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