import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(quotes)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching quotes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const quote = await prisma.quote.create({
      data: {
        quote: data.quote,
        thinker: data.thinker
      }
    })
    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json({ error: 'Error creating quote' }, { status: 500 })
  }
} 