import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authLimiter, apiLimiter } from './lib/rateLimit'
import { prisma } from '@/lib/db'

const RATE_LIMIT_RECORDS = new Map()

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const path = request.nextUrl.pathname

  // Skip rate limiting for initial setup and first login attempt
  if (path === '/api/auth/init' || path === '/api/auth/login') {
    const key = `auth:${ip}`
    const record = RATE_LIMIT_RECORDS.get(key)
    
    // If this is the first few attempts, don't apply rate limiting
    if (!record || record.count < 3) {
      return NextResponse.next()
    }
  }

  // Different limits for different endpoints
  if (path.startsWith('/api/auth')) {
    const limiter = authLimiter
    const key = `auth:${ip}`
    const record = RATE_LIMIT_RECORDS.get(key) || { count: 0, resetTime: Date.now() + limiter.windowMs }

    // Reset if window expired
    if (Date.now() > record.resetTime) {
      record.count = 0
      record.resetTime = Date.now() + limiter.windowMs
    }

    record.count++
    RATE_LIMIT_RECORDS.set(key, record)

    if (record.count > limiter.max) {
      return limiter.handler()
    }
  }

  // General API rate limiting
  if (path.startsWith('/api/')) {
    const limiter = apiLimiter
    const key = `api:${ip}`
    const record = RATE_LIMIT_RECORDS.get(key) || { count: 0, resetTime: Date.now() + limiter.windowMs }

    if (Date.now() > record.resetTime) {
      record.count = 0
      record.resetTime = Date.now() + limiter.windowMs
    }

    record.count++
    RATE_LIMIT_RECORDS.set(key, record)

    if (record.count > limiter.max) {
      return NextResponse.json(
        { error: limiter.message },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

// Configure which routes use the middleware
export const config = {
  matcher: [
    '/login'
  ]
} 