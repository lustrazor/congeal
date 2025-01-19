import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Fetching groups from database')
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })
    
    console.log('Found groups:', groups.length)
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, isDivider, isPrivate, iconName, iconColor } = await request.json()

    const highestOrder = await prisma.group.findFirst({
      orderBy: { order: 'desc' }
    })

    const group = await prisma.group.create({
      data: { 
        name,
        isDivider: isDivider || false,
        isPrivate: isPrivate || false,
        iconName,
        iconColor,
        order: (highestOrder?.order ?? -1) + 1 
      }
    })
    return NextResponse.json(group)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating group' }, { status: 500 })
  }
} 