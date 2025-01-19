import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { Encryption } from '@/lib/encryption'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const rawPrisma = new PrismaClient()

    const user = await rawPrisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Initialize encryption with user's salt
    const salt = user.encryptionSalt
    if (salt) {
      await Encryption.initialize(password, salt)
    }

    // Set auth cookie with proper options
    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    await rawPrisma.$disconnect()
    return response
  } catch (error) {
    console.error('Login failed:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
} 