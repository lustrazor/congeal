import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rawPrisma = new PrismaClient()
    await rawPrisma.quote.delete({
      where: { id: parseInt(params.id) }
    })
    await rawPrisma.$disconnect()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting quote' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const rawPrisma = new PrismaClient()
    
    const quote = await rawPrisma.quote.update({
      where: { id: parseInt(params.id) },
      data: {
        quote: data.quote,
        thinker: data.thinker
      }
    })
    
    await rawPrisma.$disconnect()
    return NextResponse.json(quote)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating quote' }, { status: 500 })
  }
} 