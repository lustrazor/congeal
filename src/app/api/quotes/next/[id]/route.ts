import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentId = parseInt(params.id)
    
    // Get the next quote after the current one
    const nextQuote = await prisma.quote.findFirst({
      where: {
        id: {
          gt: currentId
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    // If no next quote, wrap around to the first one
    if (!nextQuote) {
      const firstQuote = await prisma.quote.findFirst({
        orderBy: {
          id: 'asc'
        }
      })
      return NextResponse.json(firstQuote)
    }

    return NextResponse.json(nextQuote)
  } catch (error) {
    console.error('Failed to fetch next quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch next quote' },
      { status: 500 }
    )
  }
} 