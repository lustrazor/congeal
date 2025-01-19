import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst()
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json()
    
    // Create a raw Prisma client for non-encrypted operations
    const rawPrisma = new PrismaClient()
    
    // Update only the fields that were provided
    const settings = await rawPrisma.settings.update({
      where: { id: 1 },
      data: updates
    })

    await rawPrisma.$disconnect()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 })
  }
} 