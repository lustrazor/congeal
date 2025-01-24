import { NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'

// GET specific snapshot
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure snapshots directory exists
    const snapshotsDir = join(process.cwd(), 'snapshots')
    await mkdir(snapshotsDir, { recursive: true })

    // Log the path and ID for debugging
    console.log('Reading snapshot:', {
      id: params.id,
      path: join(snapshotsDir, params.id)
    })

    const path = join(snapshotsDir, params.id)
    const data = await readFile(path, 'utf-8')
    
    // Log successful read
    console.log('Successfully read snapshot data')
    
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    // Add more detailed error logging
    console.error('Failed to read snapshot:', {
      error,
      id: params.id,
      path: join(process.cwd(), 'snapshots', params.id)
    })
    
    return NextResponse.json(
      { error: 'Failed to read snapshot', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE specific snapshot
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotId = params.id
    // Remove any extra .json extension from the ID
    const cleanId = snapshotId.replace(/\.json$/, '')
    
    const path = join(process.cwd(), 'snapshots', `${cleanId}.json`)
    
    await unlink(path)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    )
  }
} 