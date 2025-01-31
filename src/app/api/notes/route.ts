import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(notes)
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, tags } = await request.json()
    
    const tagsString = Array.isArray(tags) ? tags.join(',') : tags

    const note = await prisma.note.create({
      data: {
        title,
        content,
        tags: tagsString || ''
      }
    })
    
    return NextResponse.json(note)
  } catch (error) {
    console.error('Failed to create note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
} 