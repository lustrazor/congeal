import crypto from 'crypto'
import { cookies } from 'next/headers'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32
const ITERATIONS = 100000

export class Encryption {
  private static key: Buffer | null = null

  static generateSalt(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static async initialize(password: string, salt: string): Promise<void> {
    // Generate key from password and salt
    this.key = await this.deriveKey(password, salt)
    
    // Store key in cookie for persistence across requests
    const cookieStore = cookies()
    cookieStore.set('encryption-key', this.key.toString('hex'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    })
  }

  static encrypt(text: string): string {
    const key = this.getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ])
    
    const tag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`
  }

  static decrypt(text: string): string {
    const key = this.getKey()
    const [ivHex, encryptedHex, tagHex] = text.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    return decipher.update(encrypted) + decipher.final('utf8')
  }

  private static getKey(): Buffer {
    if (this.key) return this.key

    // Try to get key from cookie
    const cookieStore = cookies()
    const keyHex = cookieStore.get('encryption-key')?.value
    if (!keyHex) {
      throw new Error('Encryption not initialized')
    }
    this.key = Buffer.from(keyHex, 'hex')
    return this.key
  }

  private static async deriveKey(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, key) => {
        if (err) reject(err)
        resolve(key)
      })
    })
  }
}