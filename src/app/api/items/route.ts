import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { IconName } from '@/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    
    // Define where clause based on groupId parameter
    const where = groupId === 'null' 
      ? { groupId: null }  // Ungrouped items
      : groupId 
        ? { groupId: parseInt(groupId) }  // Specific group
        : {};  // Show all items (empty where clause)

    const items = await prisma.item.findMany({
      where,
      include: {
        group: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Log full request body
    console.log('POST /api/items - Request body:', data)

    // Ensure iconName is present and valid
    if (!data.iconName) {
      data.iconName = 'undefined' as IconName // Set default if missing
    }

    // Create item with validated data
    const item = await prisma.item.create({
      data: {
        name: data.name,
        description: data.description || '',
        status: data.status || 'gray',
        iconName: data.iconName,
        groupId: data.groupId ? Number(data.groupId) : null,
        useStatusColor: data.useStatusColor ?? true,
        dueAt: data.dueAt ? new Date(data.dueAt) : null
      }
    })

    // Log created item
    console.log('POST /api/items - Created item:', item)
    return NextResponse.json(item)
  } catch (error) {
    console.error('POST /api/items - Error:', error)
    return NextResponse.json(
      { error: 'Failed to create item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    
    // Ensure iconName is present and valid
    if (!data.iconName) {
      data.iconName = 'undefined' as IconName // Set default if missing
    }

    const item = await prisma.item.update({
      where: { id: Number(data.id) },
      data: {
        name: data.name,
        description: data.description || '',
        status: data.status || 'gray',
        iconName: data.iconName,
        groupId: data.groupId ? Number(data.groupId) : null,
        useStatusColor: data.useStatusColor ?? true,
        dueAt: data.dueAt ? new Date(data.dueAt) : null
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('PATCH /api/items - Error:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
} 