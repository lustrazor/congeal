import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email'

const execAsync = promisify(exec)

// Generate a 12-digit alphanumeric code
function generateResetCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars[crypto.randomInt(chars.length)]
  }
  return code
}

// Send email
async function sendResetEmail(to: string, resetCode: string) {
  const subject = 'Password Reset Code'
  const body = `
Your password reset code is: ${resetCode}

Enter this code on the password reset page to continue.
This code will expire in 1 hour.

If you did not request this password reset, please ignore this email.
`
  return sendEmail({
    to,
    subject,
    body,
    bcc: process.env.MAIL_FROM_ADDRESS
  })
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    console.log('Processing reset request for:', username)

    // Check if user exists - use simple case-insensitive search
    const user = await prisma.user.findFirst({
      where: {
        username: {
          startsWith: username,
          endsWith: username
        }
      }
    })

    if (!user) {
      console.log('User not found:', username)
      // Return success even if user doesn't exist to prevent user enumeration
      return NextResponse.json({ success: true })
    }

    // Generate reset code
    const resetToken = generateResetCode()
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour from now

    console.log('Generated reset code for user:', username)

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: resetExpires
      }
    })

    console.log('Saved reset token to database')

    // Send reset email
    const emailSent = await sendResetEmail(username, resetToken)

    if (!emailSent) {
      console.error('Failed to send email to:', username)
      throw new Error('Failed to send reset email')
    }

    console.log('Successfully sent reset email to:', username)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
} 