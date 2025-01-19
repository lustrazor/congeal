import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Add route segment config to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Get total count first
    const count = await prisma.quote.count()
    
    if (count === 0) {
      return NextResponse.json(
        { error: 'No quotes found' },
        { status: 404 }
      )
    }

    // Generate random skip value
    const randomSkip = Math.floor(Math.random() * count)

    // Get random quote
    const quote = await prisma.quote.findFirst({
      skip: randomSkip,
      // Add orderBy to ensure consistent behavior
      orderBy: {
        id: 'asc'
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'No quote found' },
        { status: 404 }
      )
    }

    // Set cache control headers
    const response = NextResponse.json(quote)
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    
    return response
  } catch (error) {
    console.error('Failed to fetch random quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
} 