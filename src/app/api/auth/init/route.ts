import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { Encryption } from '@/lib/encryption'
import initialData from '../../.././../../prisma/initial-data.json'
import { execSync } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { username, password, includeSeedData } = await req.json()
    console.log('Init request:', { username, includeSeedData })

    // Run schema push to ensure database is created and up to date
    console.log('Setting up database schema...')
    try {
      // Force a new prisma client instance to ensure clean state
      await prisma.$disconnect()

      // Push the schema to the database
      execSync('npx prisma db push --force-reset', {
        stdio: 'inherit',
        cwd: path.resolve(process.cwd())
      })

      // Generate fresh client
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: path.resolve(process.cwd())
      })

      // Reconnect prisma with fresh client
      await prisma.$connect()
    } catch (error) {
      console.error('Database setup failed:', error)
      throw new Error('Failed to setup database schema')
    }

    // Generate salt and hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const encryptionSalt = Encryption.generateSalt()

    // Initialize encryption BEFORE creating any data
    await Encryption.initialize(password, encryptionSalt)

    await prisma.$transaction(async (tx) => {
      // Create admin user with encryption salt
      await tx.user.create({
        data: {
          username,
          password: hashedPassword,
          isAdmin: true,
          encryptionSalt
        }
      })

      // Get sanitized data
      const sanitizedData = JSON.parse(JSON.stringify(initialData.data))

      // Create settings using seed data if available, otherwise use defaults
      await tx.settings.create({
        data: sanitizedData.settings || {
          title: 'Congeal',
          tagline: 'Create balanced groups with ease',
          language: 'en',
          theme: 'system',
          showHeader: true
        }
      })

      if (includeSeedData) {
        console.log('Creating initial content...')

        for (const group of sanitizedData.groups || []) {
          await tx.group.create({ data: group })
        }

        for (const item of sanitizedData.items || []) {
          await tx.item.create({ data: item })
        }

        for (const quote of sanitizedData.quotes || []) {
          await tx.quote.create({ data: quote })
        }

        for (const note of sanitizedData.notes || []) {
          await tx.note.create({ data: note })
        }

        console.log('Seed data creation completed')
      }
    })

    console.log('Initialization completed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Initialization failed:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}