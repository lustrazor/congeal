import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Create default settings if they don't exist
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      emailEnabled: false,
      google_enabled: false,
      outlook_enabled: false,
      // ... other default settings ...
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 