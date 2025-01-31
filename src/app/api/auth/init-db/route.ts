import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({}))
    const loadExampleData = data.loadExampleData ?? false

    // First create the initial migration
    await execAsync('npx prisma migrate dev --name init --create-only')
    
    // Then apply it
    await execAsync('npx prisma migrate deploy')
    
    // Generate Prisma client
    await execAsync('npx prisma generate')

    // Verify database connection
    await prisma.$connect()

    // Create default settings using Prisma model field names
    await prisma.settings.create({
      data: {
        title: 'Congeal',
        tagline: 'Create balanced groups with ease',
        isDark: false,                    // Use model name, not column name
        headerEnabled: true,              // Use model name, not column name
        showPrivateGroups: false,         // Use model name, not column name
        version: '1.0.25',
        debugMode: false,                 // Use model name, not column name
        isPublic: false,                  // Use model name, not column name
        all_view_mode: 'grid',
        ungrouped_view_mode: 'grid',
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

    // If loadExampleData is true, create example groups and items
    if (loadExampleData) {
      // Create example groups
      const groups = await prisma.$transaction([
        prisma.group.create({
          data: {
            name: 'Getting Started',
            order: 1,
            iconName: 'star'
          }
        }),
        prisma.group.create({
          data: {
            name: 'Important',
            order: 2,
            iconName: 'flag'
          }
        }),
        prisma.group.create({
          data: {
            name: 'Projects',
            order: 3,
            iconName: 'folder'
          }
        })
      ])

      // Create example items
      await prisma.$transaction([
        prisma.item.create({
          data: {
            name: 'Welcome to Congeal!',
            description: 'This is an example item to help you get started.',
            status: 'blue',
            groupId: groups[0].id,
            order: 1
          }
        }),
        prisma.item.create({
          data: {
            name: 'Create your first group',
            description: 'Click the + button in the sidebar to create a new group.',
            status: 'green',
            groupId: groups[0].id,
            order: 2
          }
        })
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 