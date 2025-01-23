import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { username, code } = await req.json()

    // Find user with matching reset code
    const user = await prisma.user.findFirst({
      where: {
        username,
        resetToken: code,
        resetTokenExpires: {
          gt: new Date() // Token hasn't expired
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Reset code verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify reset code' },
      { status: 500 }
    )
  }
} 