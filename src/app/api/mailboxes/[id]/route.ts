import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()

    const mailbox = await prisma.mailbox.update({
      where: { id },
      data: {
        name: data.name,
        iconName: data.iconName,
        iconColor: data.iconColor,
        email: data.email,
        imapHost: data.imapHost,
        imapPort: data.imapPort,
        username: data.username,
        password: data.password,
        useSSL: data.useSSL,
        useOAuth: data.useOAuth
      }
    })

    return NextResponse.json(mailbox)
  } catch (error) {
    console.error('Error updating mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to update mailbox' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await prisma.mailbox.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    )
  }
} 