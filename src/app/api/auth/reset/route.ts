import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const rawPrisma = new PrismaClient()

    console.log('Starting factory reset...')

    // Force delete everything
    try {
      await rawPrisma.$executeRaw`DELETE FROM Item`
      await rawPrisma.$executeRaw`DELETE FROM Quote`
      await rawPrisma.$executeRaw`DELETE FROM "Group"`
      await rawPrisma.$executeRaw`DELETE FROM Settings`
      await rawPrisma.$executeRaw`DELETE FROM User`
      
      // Reset auto-increment counters
      await rawPrisma.$executeRaw`DELETE FROM sqlite_sequence`
    } catch (error) {
      console.error('Error during raw delete:', error)
    }

    console.log('All data deleted')
    await rawPrisma.$disconnect()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Factory reset failed:', error)
    return NextResponse.json(
      { error: 'Failed to reset application' },
      { status: 500 }
    )
  }
} 