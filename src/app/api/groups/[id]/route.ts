import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { PrismaClient } from '@prisma/client'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Comment out detailed logging
  // logger.log('=== Group Update Request Started ===')
  // logger.log('Group ID:', params.id)

  try {
    const data = await request.json()
    // logger.log('Received update data:', {
    //   name: data.name,
    //   iconName: data.iconName,
    //   iconColor: data.iconColor,
    //   isDivider: data.isDivider,
    //   viewMode: data.viewMode
    // })

    // Get current group data
    const currentGroup = await prisma.group.findUnique({
      where: { id: parseInt(params.id) }
    })
    // logger.log('Current group data:', currentGroup)

    // Create a raw Prisma client for non-encrypted operations
    const rawPrisma = new PrismaClient()
    
    // logger.log('Attempting database update...')
    const group = await rawPrisma.group.update({
      where: { id: parseInt(params.id) },
      data: {
        name: data.name,
        iconName: data.iconName,
        iconColor: data.iconColor,
        isDivider: data.isDivider,
        isPrivate: data.isPrivate,
        viewMode: data.viewMode
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    })

    // logger.log('Update successful. New group data:', group)
    await rawPrisma.$disconnect()

    // logger.log('=== Group Update Request Completed ===')
    return NextResponse.json(group)
  } catch (error) {
    // logger.error('Group update failed', {
    //   groupId: params.id,
    //   error: error instanceof Error ? {
    //     message: error.message,
    //     stack: error.stack
    //   } : String(error)
    // })
    // logger.log('=== Group Update Request Failed ===')

    return NextResponse.json({ 
      error: 'Error updating group',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = parseInt(params.id)
    
    // Get deleteItems from the request URL params
    const { searchParams } = new URL(request.url)
    const deleteItems = searchParams.get('deleteItems') === 'true'

    // Only delete items if explicitly requested
    if (deleteItems) {
      await prisma.item.deleteMany({
        where: { groupId }
      })
    }
    
    // Then delete the group
    await prisma.group.delete({
      where: { id: groupId }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete group:', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const id = parseInt(params.id)

    // Only include fields that are provided in the request
    const updateData: any = {}
    if (data.viewMode !== undefined) updateData.viewMode = data.viewMode
    if (data.sortField !== undefined) updateData.sortField = data.sortField
    if (data.sortDirection !== undefined) updateData.sortDirection = data.sortDirection
    if (data.name !== undefined) updateData.name = data.name
    if (data.iconName !== undefined) updateData.iconName = data.iconName
    if (data.iconColor !== undefined) updateData.iconColor = data.iconColor
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate
    if (data.isDivider !== undefined) updateData.isDivider = data.isDivider
    if (data.order !== undefined) updateData.order = data.order

    const group = await prisma.group.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to update group:', error)
    return NextResponse.json(
      { error: 'Failed to update group', details: String(error) },
      { status: 500 }
    )
  }
} 