import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
  try {
    const rawPrisma = new PrismaClient()
    const quotes = await rawPrisma.quote.findMany({
      orderBy: { createdAt: 'desc' }
    })
    await rawPrisma.$disconnect()
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching quotes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const rawPrisma = new PrismaClient()
    
    const quote = await rawPrisma.quote.create({
      data: {
        quote: data.quote,
        thinker: data.thinker
      }
    })
    
    await rawPrisma.$disconnect()
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Error creating quote' }, { status: 500 })
  }
} 