import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type')
    
    if (!file || type !== 'notification') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 2MB limit' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const path = join(process.cwd(), 'public', 'sounds', 'notification.mp3')
    await writeFile(path, buffer)
    
    return NextResponse.json({ 
      success: true,
      message: 'Sound uploaded successfully'
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
} 