import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Add route segment config
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const token = cookies().get('auth-token')?.value
    return NextResponse.json({ 
      isAuthenticated: !!token 
    })
  } catch (error) {
    console.error('Session check failed:', error)
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    )
  }
} 