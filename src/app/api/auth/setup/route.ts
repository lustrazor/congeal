import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { Encryption } from '@/lib/encryption'
import { sendEmail } from '@/lib/email'
import initialData from '../../.././../../prisma/initial-data.json'

// Helper to sanitize data
function sanitizeData(data: any) {
  // Deep clone and sanitize the data
  const sanitized = JSON.parse(JSON.stringify(data))
  
  // Remove any undefined/null values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key]
    }
  })
  
  return sanitized
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, seedData } = await req.json()

    // Generate salt and hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    const encryptionSalt = Encryption.generateSalt()

    // Initialize encryption BEFORE creating any data
    await Encryption.initialize(password, encryptionSalt)

    // Create admin user with encryption salt
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: true,
        encryptionSalt
      }
    })

    // Create default settings
    await prisma.settings.create({
      data: {
        title: 'Congeal',
        tagline: 'Create balanced groups with ease'
      }
    })

    // If seedData is true, load initial data
    if (seedData) {
      console.log('Creating initial content with seed data:', seedData)
      
      // Get sanitized data
      const sanitizedData = sanitizeData(initialData.data)

      // Create data in same order as snapshot restore
      console.log('Creating settings...')
      if (sanitizedData.settings) {
        await prisma.settings.create({
          data: sanitizedData.settings
        })
      }

      // Create data sequentially to ensure encryption
      for (const group of sanitizedData.groups || []) {
        console.log('Creating group:', group.name)
        await prisma.group.create({ data: group })
      }

      for (const item of sanitizedData.items || []) {
        console.log('Creating item:', item.name)
        await prisma.item.create({ data: item })
      }

      for (const quote of sanitizedData.quotes || []) {
        console.log('Creating quote:', quote.quote?.substring(0, 20))
        await prisma.quote.create({ data: quote })
      }

      for (const note of sanitizedData.notes || []) {
        console.log('Creating note:', note.title)
        await prisma.note.create({ data: note })
      }

      console.log('Seed data creation completed')
    }

    // Send notification email to admin
    const adminNotificationBody = `
New admin user created:
Username: ${username}
Time: ${new Date().toLocaleString()}
Instance: ${process.env.NEXT_PUBLIC_BASE_URL}

This is an automated notification.
`
    await sendEmail({
      to: process.env.MAIL_FROM_ADDRESS!,
      subject: 'New Admin User Created',
      body: adminNotificationBody
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to complete setup' },
      { status: 500 }
    )
  }
} 