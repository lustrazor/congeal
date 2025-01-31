import { PrismaClient } from '@prisma/client'

/**
 * @deprecated Use `import { prisma } from '@/lib/db'` instead to ensure encryption middleware is used
 */
export const prisma = new PrismaClient() 