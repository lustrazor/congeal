import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.RELAY_SERVER,
  port: parseInt(process.env.RELAY_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.RELAY_ACCOUNT,
    pass: process.env.RELAY_PASSWORD,
  },
  // Additional recommended settings
  tls: {
    rejectUnauthorized: true, // Verify SSL/TLS certificates
  },
  pool: true, // Use connection pool
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000, // Limit to 1 message per second
  rateLimit: 5, // Maximum 5 messages per rateDelta
})

export async function sendEmail({
  to,
  subject,
  body,
  bcc
}: {
  to: string
  subject: string
  body: string
  bcc?: string
}) {
  try {
    // Verify connection configuration
    await transporter.verify()

    const mailOptions = {
      from: {
        name: process.env.MAIL_FROM_NAME || 'Congeal',
        address: process.env.MAIL_FROM_ADDRESS!
      },
      replyTo: process.env.MAIL_REPLY_TO,
      to,
      bcc,
      subject,
      text: body,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
} 