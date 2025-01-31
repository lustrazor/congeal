import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

///
/// Restores database from snapshots stored in the /snapshots directory
/// This is different from upload/route.ts which handles user-uploaded files
///
export async function POST(req: NextRequest) {
  try {
    const snapshot = await req.json()

    await prisma.$transaction(async (tx) => {
      // Clear existing data first
      await tx.note.deleteMany()
      await tx.quote.deleteMany()
      await tx.item.deleteMany()
      await tx.group.deleteMany()

      // Restore data using Prisma create operations to trigger encryption
      for (const group of snapshot.groups || []) {
        await tx.group.create({ data: group })
      }

      for (const item of snapshot.items || []) {
        await tx.item.create({ data: item })
      }

      for (const quote of snapshot.quotes || []) {
        await tx.quote.create({ data: quote })
      }

      for (const note of snapshot.notes || []) {
        await tx.note.create({ data: note })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json(
      { error: 'Failed to restore snapshot' },
      { status: 500 }
    )
  }
} 