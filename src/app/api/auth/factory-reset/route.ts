import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    // First disconnect from database
    await prisma.$disconnect()

    // Get path to database file
    const dbPath = path.join(process.cwd(), 'prisma/dev.db')

    // Empty the database file completely
    fs.writeFileSync(dbPath, '')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Factory reset failed:', error)
    return NextResponse.json(
      { error: 'Failed to reset application' },
      { status: 500 }
    )
  }
} 