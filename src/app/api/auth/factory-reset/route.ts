import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    // Get the current user
    const user = await prisma.user.findFirst({
      where: { isAdmin: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No admin user found' },
        { status: 404 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Proceed with factory reset
    await prisma.$transaction([
      prisma.item.deleteMany(),
      prisma.quote.deleteMany(),
      prisma.group.deleteMany(),
      prisma.settings.deleteMany(),
      prisma.user.deleteMany(),
    ])

    // Reset auto-increment
    await prisma.$executeRaw`DELETE FROM sqlite_sequence`

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Factory reset failed:', error)
    return NextResponse.json(
      { error: 'Failed to reset application' },
      { status: 500 }
    )
  }
} 