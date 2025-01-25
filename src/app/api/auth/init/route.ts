import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { Encryption } from '@/lib/encryption'
import initialData from '@/../../prisma/initial-data.json'
import { execSync } from 'child_process'

// Create initial content from JSON file
const createInitialContent = async (prisma: PrismaClient, includeSeedData: boolean) => {
  console.log('Creating initial content with seed data:', includeSeedData)

  try {
    // Create settings first
    console.log('Creating settings...')
    await prisma.settings.create({
      data: includeSeedData 
        ? {
            ...initialData.data.settings,
            updatedAt: new Date(initialData.data.settings.updatedAt)
          }
        : {
            title: 'Congeal',
            tagline: 'Create balanced groups with ease',
            isDark: false,
            headerImage: null,
            headerEnabled: false,
            all_view_mode: 'grid',
            ungrouped_view_mode: 'grid',
            showPrivateGroups: false,
            version: '1.0.24',
            debugMode: false,
            isPublic: false,
            language: 'en',
            emailEnabled: false,
            google_enabled: false,
            outlook_enabled: false,
            all_sort_field: 'order',
            all_sort_direction: 'asc',
            ungrouped_sort_field: 'order',
            ungrouped_sort_direction: 'asc',
            updatedAt: new Date()
          }
    })

    if (!includeSeedData) {
      console.log('Skipping seed data as requested')
      return
    }

    // Create groups with exact data
    console.log('Creating groups...')
    const groups = initialData.data.groups || []
    for (const group of groups) {
      await prisma.group.create({
        data: {
          ...group,
          createdAt: new Date(group.createdAt),
          updatedAt: new Date(group.updatedAt)
        }
      })
    }

    // Create items with exact data
    console.log('Creating items...')
    const items = initialData.data.items || []
    for (const item of items) {
      await prisma.item.create({
        data: {
          ...item,
          dueAt: item.dueAt ? new Date(item.dueAt) : null,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }
      })
    }

    // Create quotes with exact data
    console.log('Creating quotes...')
    const quotes = initialData.data.quotes || []
    for (const quote of quotes) {
      await prisma.quote.create({
        data: {
          ...quote,
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt)
        }
      })
    }

    // Create notes with exact data
    console.log('Creating notes...')
    const notes = initialData.data.notes || []
    for (const note of notes) {
      await prisma.note.create({
        data: {
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }
      })
    }

    console.log('Seed data creation completed')
  } catch (error) {
    console.error('Error creating initial content:', error)
    throw error // Re-throw to be handled by the transaction
  }
}

export async function POST(request: Request) {
  let rawPrisma: PrismaClient | null = null
  
  try {
    const { username, password, includeSeedData } = await request.json()
    console.log('Init request:', { username, includeSeedData })

    // Run migrations first
    try {
      console.log('Running database migrations...')
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    } catch (error) {
      console.error('Migration failed:', error)
      return NextResponse.json({ 
        error: 'Failed to initialize database schema' 
      }, { 
        status: 500 
      })
    }

    rawPrisma = new PrismaClient()

    // Check if user already exists first
    const existingUser = await rawPrisma.user.findFirst()
    if (existingUser) {
      await rawPrisma.$disconnect()
      return NextResponse.json({ 
        error: 'Application already initialized' 
      }, { 
        status: 400 
      })
    }

    // Wrap all operations in a transaction
    await rawPrisma.$transaction(async (tx) => {
      // Clean up existing data
      await Promise.all([
        tx.item.deleteMany(),
        tx.group.deleteMany(),
        tx.quote.deleteMany(),
        tx.note.deleteMany(),
        tx.settings.deleteMany(),
        tx.user.deleteMany(),
      ])

      // Create admin user
      const hashedPassword = await hash(password, 12)
      const salt = await Encryption.initialize(password)
      await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          isAdmin: true,
          encryptionSalt: salt
        }
      })

      // Create initial content
      await createInitialContent(tx, includeSeedData)
    })

    console.log('Initialization completed successfully')
    await rawPrisma.$disconnect()
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Initialization failed:', error)
    if (rawPrisma) await rawPrisma.$disconnect()
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to initialize application' 
    }, { 
      status: 500 
    })
  }
} 