import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { prisma } from '@/lib/prisma'

// Helper to sanitize data
const sanitizeData = (data: any) => {
  // Remove any potential script tags or dangerous content
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        // Sanitize strings
        if (typeof value === 'string') {
          value = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
        }
        return [key, sanitize(value)]
      })
    )
  }
  
  return sanitize(data)
}

export async function POST(req: NextRequest) {
  try {
    const snapshot = await req.json()

    // Debug logging
    console.log('Received snapshot:', {
      hasVersion: !!snapshot.version,
      hasSchema: !!snapshot.schema,
      hasData: !!snapshot.data,
      version: snapshot.version,
      schema: snapshot.schema,
      dataKeys: snapshot.data ? Object.keys(snapshot.data) : []
    })

    // Validate required fields - match backup format
    if (!snapshot.version || !snapshot.schema || !snapshot.data) {
      console.log('Validation failed:', {
        missingVersion: !snapshot.version,
        missingSchema: !snapshot.schema,
        missingData: !snapshot.data
      })
      return NextResponse.json(
        { error: 'Invalid snapshot format' },
        { status: 400 }
      )
    }

    // Validate version compatibility
    const currentVersion = '1.1.0'
    if (snapshot.version > currentVersion) {
      return NextResponse.json(
        { error: 'Snapshot version not supported' },
        { status: 400 }
      )
    }

    // Validate data structure
    const requiredCollections = ['groups', 'items', 'settings']
    for (const collection of requiredCollections) {
      if (!snapshot.data[collection]) {
        console.log('Missing required collection:', collection)
        return NextResponse.json(
          { error: `Missing required data: ${collection}` },
          { status: 400 }
        )
      }
    }

    // Sanitize the data before restoring
    const sanitizedData = sanitizeData(snapshot.data)

    // Restore data to database
    await prisma.$transaction(async (tx) => {
      // Clear existing data
      await tx.message.deleteMany()
      await tx.mailbox.deleteMany()
      await tx.note.deleteMany()
      await tx.quote.deleteMany()
      await tx.item.deleteMany()
      await tx.group.deleteMany()
      await tx.settings.deleteMany()

      // Restore data
      if (sanitizedData.settings) {
        await tx.settings.create({ data: sanitizedData.settings })
      }
      
      await tx.group.createMany({ data: sanitizedData.groups })
      await tx.item.createMany({ data: sanitizedData.items })
      await tx.quote.createMany({ data: sanitizedData.quotes })
      await tx.note.createMany({ data: sanitizedData.notes })

      // Restore email data if present
      if (snapshot.schema.includesEmail) {
        if (sanitizedData.mailboxes?.data) {
          await tx.mailbox.createMany({ data: sanitizedData.mailboxes.data })
        }
        if (sanitizedData.messages?.data) {
          await tx.message.createMany({ data: sanitizedData.messages.data })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Snapshot upload failed:', error)
    return NextResponse.json(
      { error: 'Failed to process snapshot upload' },
      { status: 500 }
    )
  }
} 