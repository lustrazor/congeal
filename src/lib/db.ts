import { PrismaClient } from '@prisma/client'
import { Encryption } from './encryption'

// Create a Prisma client with encryption extensions
export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async create({ args, query }) {
        // Encrypt sensitive fields before creating
        if (args.data) {
          const encryptedFields = {
            Group: ['name', 'iconName'],
            Item: ['name', 'description', 'status', 'iconName'],
            Quote: ['quote', 'thinker']
          }

          const model = args.$type
          if (encryptedFields[model]) {
            encryptedFields[model].forEach(field => {
              if (args.data[field]) {
                try {
                  args.data[field] = Encryption.encrypt(args.data[field])
                } catch (error) {
                  console.warn(`Failed to encrypt ${field}:`, error)
                }
              }
            })
          }
        }
        return query(args)
      },

      async update({ args, query }) {
        // Encrypt sensitive fields before updating
        if (args.data) {
          const encryptedFields = {
            Group: ['name', 'iconName'],
            Item: ['name', 'description', 'status', 'iconName'],
            Quote: ['quote', 'thinker']
          }

          const model = args.$type
          if (encryptedFields[model]) {
            encryptedFields[model].forEach(field => {
              if (args.data[field]) {
                try {
                  args.data[field] = Encryption.encrypt(args.data[field])
                } catch (error) {
                  console.warn(`Failed to encrypt ${field}:`, error)
                }
              }
            })
          }
        }
        return query(args)
      },

      async findMany({ args, query }) {
        const results = await query(args)
        
        // Decrypt sensitive fields after fetching
        const encryptedFields = {
          Group: ['name', 'iconName'],
          Item: ['name', 'description', 'status', 'iconName'],
          Quote: ['quote', 'thinker']
        }

        const model = args.$type
        if (results && encryptedFields[model]) {
          return results.map(item => {
            encryptedFields[model].forEach(field => {
              if (item[field]) {
                try {
                  item[field] = Encryption.decrypt(item[field])
                } catch (error) {
                  console.warn(`Failed to decrypt ${field}:`, error)
                }
              }
            })
            return item
          })
        }
        return results
      },

      async findFirst({ args, query }) {
        const result = await query(args)
        if (!result) return result

        // Decrypt sensitive fields after fetching
        const encryptedFields = {
          Group: ['name', 'iconName'],
          Item: ['name', 'description', 'status', 'iconName'],
          Quote: ['quote', 'thinker']
        }

        const model = args.$type
        if (encryptedFields[model]) {
          encryptedFields[model].forEach(field => {
            if (result[field]) {
              try {
                result[field] = Encryption.decrypt(result[field])
              } catch (error) {
                console.warn(`Failed to decrypt ${field}:`, error)
              }
            }
          })
        }
        return result
      }
    }
  }
}) 