import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

export class Encryption {
  private static key: Buffer | null = null
  private static salt: Buffer | null = null

  static async initialize(password: string, salt?: string) {
    // If salt is provided, use it (for existing DB)
    // If not, generate new salt (for first-time setup)
    this.salt = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH)
    
    // Generate key from password using PBKDF2
    this.key = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, this.salt!, ITERATIONS, KEY_LENGTH, 'sha512', (err, key) => {
        if (err) reject(err)
        resolve(key)
      })
    })

    return this.salt.toString('hex')
  }

  static encrypt(text: string): string {
    if (!this.key) throw new Error('Encryption not initialized')

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()

    // Combine IV, encrypted data, and auth tag
    return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex')
  }

  static decrypt(encryptedData: string): string {
    if (!this.key) throw new Error('Encryption not initialized')

    const [ivHex, encrypted, tagHex] = encryptedData.split(':')
    
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}