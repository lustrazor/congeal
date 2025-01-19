import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotPath = path.join(process.cwd(), 'snapshots', `${params.id}.json`)
    const fileContent = await fs.readFile(snapshotPath)
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${params.id}.json"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error downloading snapshot' }, { status: 500 })
  }
} 