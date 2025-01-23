import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { username, password, seedData } = await req.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: true
      }
    })

    // Create default settings
    await prisma.settings.create({
      data: {
        title: 'Congeal',
        tagline: 'Create balanced groups with ease'
      }
    })

    // Add seed data if requested
    if (seedData) {
      await prisma.group.create({
        data: {
          name: 'Getting Started',
          order: 0,
          iconName: 'bx-book-open',
          iconColor: 'blue',
          items: {
            create: [
              {
                name: 'Welcome to Congeal',
                description: 'This is an example item to help you get started.',
                status: 'blue',
                order: 0
              }
            ]
          }
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    )
  }
} 