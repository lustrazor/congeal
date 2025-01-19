import { NextResponse } from 'next/server'

export const authLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased to 100 attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  handler: () => {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    )
  }
}

export const apiLimiter = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
} 