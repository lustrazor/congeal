import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      where: {
        dueAt: {
          not: null
        }
      },
      orderBy: {
        dueAt: 'asc'
      },
      take: 3
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching due items:', error)
    return NextResponse.json([], { status: 500 })
  }
} 