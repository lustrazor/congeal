import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  try {
    // Get the absolute path to the migrations directory
    const migrationsPath = path.resolve(process.cwd(), 'prisma/migrations')

    // Run Prisma migrations
    await execAsync(`npx prisma migrate deploy --schema=${path.resolve(process.cwd(), 'prisma/schema.prisma')}`)
    
    // Generate Prisma client if needed
    await execAsync('npx prisma generate')

    // Verify database connection
    await prisma.$connect()

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