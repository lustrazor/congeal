import { NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'

// GET specific snapshot
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const path = join(process.cwd(), 'snapshots', `${params.id}.json`)
    const data = await readFile(path, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error('Failed to read snapshot:', error)
    return NextResponse.json({ error: 'Failed to read snapshot' }, { status: 500 })
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