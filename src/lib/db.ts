import { PrismaClient } from '@prisma/client'
import { Encryption } from './encryption'
import fs from 'fs'
import path from 'path'

// Ensure database file exists
const dbPath = path.join(process.cwd(), 'prisma/dev.db')
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
}

// Create a single Prisma instance
const prisma = new PrismaClient()

// Add encryption middleware
prisma.$use(async (params, next) => {
  console.log('Middleware running for:', params.model, params.action)

  // Encrypt data before saving
  if (params.action === 'create' || params.action === 'update') {
    const model = params.model?.toLowerCase()
    if (params.args.data) {
      console.log('Encrypting data for:', model)
      
      // Deep clone the data to avoid modifying the original
      const data = JSON.parse(JSON.stringify(params.args.data))

      switch(model) {
        case 'group':
          if (data.name) {
            console.log('Encrypting group name:', data.name)
            data.name = Encryption.encrypt(data.name)
          }
          break;

        case 'item':
          if (data.name) {
            console.log('Encrypting item name:', data.name)
            data.name = Encryption.encrypt(data.name)
          }
          if (data.description) {
            console.log('Encrypting item description:', data.description)
            data.description = Encryption.encrypt(data.description)
          }
          break;

        case 'note':
          if (data.title) {
            console.log('Encrypting note title:', data.title)
            data.title = Encryption.encrypt(data.title)
          }
          if (data.content) {
            console.log('Encrypting note content:', data.content)
            data.content = Encryption.encrypt(data.content)
          }
          if (data.tags) {
            console.log('Encrypting note tags:', data.tags)
            data.tags = Encryption.encrypt(data.tags)
          }
          break;

        case 'quote':
          if (data.quote) {
            console.log('Encrypting quote text:', data.quote)
            data.quote = Encryption.encrypt(data.quote)
          }
          if (data.thinker) {
            console.log('Encrypting quote thinker:', data.thinker)
            data.thinker = Encryption.encrypt(data.thinker)
          }
          break;
      }

      // Replace the original data with encrypted data
      params.args.data = data
    }
  }

  // Get result from next middleware
  const result = await next(params)

  // Decrypt data after reading
  if (params.action === 'findMany' || params.action === 'findUnique' || params.action === 'findFirst') {
    if (Array.isArray(result)) {
      return result.map(item => decryptItem(item))
    }
    return decryptItem(result)
  }

  return result
})

function isEncrypted(text: string): boolean {
  // Check if the text matches our encryption format (iv:encrypted:tag)
  return typeof text === 'string' && text.split(':').length === 3
}

function decryptItem(item: any) {
  if (!item) return item
  
  // Helper to safely decrypt
  const safeDecrypt = (text: string) => {
    try {
      if (isEncrypted(text)) {
        return Encryption.decrypt(text)
      }
      // If not encrypted, return original text
      return text
    } catch (error) {
      console.warn('Decryption failed for item:', item.id, error)
      return text // Return original text if decryption fails
    }
  }

  // Decrypt Group fields
  if (item.name) {
    item.name = safeDecrypt(item.name)
  }
  
  // Decrypt Item fields
  if (item.description) {
    item.description = safeDecrypt(item.description)
  }

  // Decrypt Note fields
  if (item.title) {
    item.title = safeDecrypt(item.title)
  }
  if (item.content) {
    item.content = safeDecrypt(item.content)
  }
  if (item.tags) {
    item.tags = safeDecrypt(item.tags)
  }

  // Decrypt Quote fields
  if (item.quote) {
    item.quote = safeDecrypt(item.quote)
  }
  if (item.thinker) {
    item.thinker = safeDecrypt(item.thinker)
  }
  
  return item
}

export { prisma } 