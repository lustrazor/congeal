import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // First check auth token
    const token = cookies().get('auth-token')?.value
    const isAuthenticated = !!token

    // Check if any user exists
    const user = await prisma.user.findFirst({
      where: { isAdmin: true }
    })
    
    // Check settings
    const settings = await prisma.settings.findFirst()

    return NextResponse.json({ 
      isSetup: !!settings,
      hasUser: !!user,
      isAuthenticated
    })
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check setup status',
      isSetup: false,
      hasUser: false,
      isAuthenticated: false
    }, { 
      status: 500 
    })
  }
} 