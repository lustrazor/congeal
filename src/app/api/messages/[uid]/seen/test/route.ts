import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Seen route is registered' })
} 