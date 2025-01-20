import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { Encryption } from '@/lib/encryption'
import initialData from '@/../../prisma/initial-data.json'

// Create initial content from JSON file
const createInitialContent = async (rawPrisma: PrismaClient, includeSeedData: boolean) => {
  console.log('Creating initial content with seed data:', includeSeedData)

  // Create settings first
  console.log('Creating settings...')
  await rawPrisma.settings.create({
    data: includeSeedData 
      ? {
          // Use settings from initial data when seed data is enabled
          ...initialData.data.settings,
          // Ensure dates are properly converted
          updatedAt: new Date(initialData.data.settings.updatedAt)
        }
      : {
          // Default settings when no seed data
          title: 'Congeal',
          tagline: 'Create balanced groups with ease',
          isDark: false,
          headerImage: null,
          headerEnabled: false,
          all_view_mode: 'grid',
          ungrouped_view_mode: 'grid',
          showPrivateGroups: false,
          version: '1.0.21',
          debugMode: false,
          isPublic: false,
          language: 'en',
          emailEnabled: false,
          google_enabled: false,
          outlook_enabled: false,
          all_sort_field: 'order',
          all_sort_direction: 'asc',
          ungrouped_sort_field: 'order',
          ungrouped_sort_direction: 'asc'
        }
  })

  if (!includeSeedData) {
    console.log('Skipping seed data as requested')
    return
  }

  // Create groups first (without items)
  const groups = initialData?.data?.groups || []
  for (const group of groups) {
    await rawPrisma.group.create({
      data: {
        id: group.id,
        name: group.name,
        order: group.order,
        iconName: group.iconName,
        iconColor: group.iconColor,
        isDivider: group.isDivider || false,
        isPrivate: group.isPrivate || false,
        viewMode: group.viewMode || 'grid',
        sortField: group.sortField || 'order',
        sortDirection: group.sortDirection || 'asc',
        createdAt: new Date(group.createdAt || Date.now()),
        updatedAt: new Date(group.updatedAt || Date.now())
      }
    })
  }

  // Create items separately
  const items = initialData?.data?.items || []
  if (items.length) {
    for (const item of items) {
      await rawPrisma.item.create({
        data: {
          id: item.id,
          name: item.name,
          description: item.description || '',
          status: item.status || 'gray',
          iconName: item.iconName || '',
          order: item.order || 0,
          useStatusColor: item.useStatusColor || true,
          dueAt: item.dueAt ? new Date(item.dueAt) : null,
          groupId: item.groupId,
          createdAt: new Date(item.createdAt || Date.now()),
          updatedAt: new Date(item.updatedAt || Date.now())
        }
      })
    }
  }

  // Create quotes
  const quotes = initialData?.data?.quotes || []
  if (quotes.length) {
    for (const quote of quotes) {
      await rawPrisma.quote.create({
        data: {
          quote: quote.quote,
          thinker: quote.thinker,
          createdAt: new Date(quote.createdAt || Date.now()),
          updatedAt: new Date(quote.updatedAt || Date.now())
        }
      })
    }
  }

  // Create notes
  const notes = initialData?.data?.notes || []
  if (notes.length) {
    for (const note of notes) {
      await rawPrisma.note.create({
        data: {
          title: note.title,
          content: note.content,
          tags: note.tags || '',
          createdAt: new Date(note.createdAt || Date.now()),
          updatedAt: new Date(note.updatedAt || Date.now())
        }
      })
    }
  }
}

export async function POST(request: Request) {
  let rawPrisma: PrismaClient | null = null
  
  try {
    const { username, password, includeSeedData } = await request.json()
    console.log('Init request:', { username, includeSeedData }) // Debug log

    rawPrisma = new PrismaClient()

    // Check if user already exists first
    const existingUser = await rawPrisma.user.findFirst()
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Application already initialized' 
      }, { 
        status: 400 
      })
    }

    // Clean up any existing data first
    await rawPrisma.$transaction([
      rawPrisma.item.deleteMany(),
      rawPrisma.group.deleteMany(),
      rawPrisma.quote.deleteMany(),
      rawPrisma.note.deleteMany(),
      rawPrisma.settings.deleteMany(),
      rawPrisma.user.deleteMany(),
    ])

    // Create admin user with encryption
    console.log('Creating admin user...')
    const hashedPassword = await hash(password, 12)
    const salt = await Encryption.initialize(password)
    await rawPrisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: true,
        encryptionSalt: salt
      }
    })

    // Create initial content based on includeSeedData flag
    await createInitialContent(rawPrisma, includeSeedData)

    console.log('Initialization completed successfully')
    await rawPrisma.$disconnect()
    return NextResponse.json({ 
      success: true,
      message: 'Admin account created successfully'
    })

  } catch (error) {
    console.error('Database operation failed:', error)
    if (rawPrisma) {
      await rawPrisma.$disconnect()
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to initialize application' 
    }, { 
      status: 500 
    })
  }
} 