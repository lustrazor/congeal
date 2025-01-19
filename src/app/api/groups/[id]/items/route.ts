import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id)
    await prisma.item.deleteMany({
      where: { groupId }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete group items:', error)
    return NextResponse.json({ error: 'Failed to delete group items' }, { status: 500 })
  }
} 