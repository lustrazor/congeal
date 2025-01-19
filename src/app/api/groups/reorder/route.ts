import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { groups } = await request.json()

    // Validate input
    if (!Array.isArray(groups)) {
      return NextResponse.json(
        { error: 'Invalid input: groups must be an array' },
        { status: 400 }
      )
    }

    // Update all groups in a transaction
    const updates = groups.map((group) => ({
      where: { id: group.id },
      data: { order: group.order }
    }))

    const result = await prisma.$transaction(
      updates.map(update => 
        prisma.group.update(update)
      )
    )

    return NextResponse.json({ success: true, groups: result })
  } catch (error) {
    console.error('Error reordering groups:', error)
    return NextResponse.json(
      { error: 'Failed to reorder groups' },
      { status: 500 }
    )
  }
} 