import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Status } from '@/types'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const id = parseInt(params.id)

    // If only status is being updated, don't modify other fields
    if (Object.keys(data).length === 1 && data.status) {
      const item = await prisma.item.update({
        where: { id },
        data: { status: data.status }
      })
      return NextResponse.json(item)
    }

    // Otherwise handle full item update
    const item = await prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        iconName: data.iconName,
        groupId: data.groupId,
        useStatusColor: data.useStatusColor,
        dueAt: data.dueAt ? new Date(data.dueAt) : null
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update item:', error)
    return NextResponse.json(
      { error: 'Failed to update item', details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.item.delete({
      where: { id: parseInt(params.id) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, status, groupId, iconName } = await request.json()

    const item = await prisma.item.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description,
        status,
        groupId,
        iconName
      },
      include: {
        group: true
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating item' }, { status: 500 })
  }
} 