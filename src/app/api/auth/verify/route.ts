import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const rawPrisma = new PrismaClient()

    const user = await rawPrisma.user.findFirst()
    if (!user) {
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      )
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    await rawPrisma.$disconnect()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password verification failed:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
} 