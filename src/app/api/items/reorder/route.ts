import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { items } = await request.json()

    // Validate input
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid input: items must be an array' },
        { status: 400 }
      )
    }

    // Update each item's order in a transaction
    const updates = await prisma.$transaction(
      items.map((item, index) => 
        prisma.item.update({
          where: { id: item.id },
          data: { order: index }
        })
      )
    )

    return NextResponse.json(updates)
  } catch (error) {
    console.error('Error reordering items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    )
  }
} 