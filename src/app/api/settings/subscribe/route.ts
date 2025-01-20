import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  
  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue('data: update\n\n')
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  )

  return response
} 