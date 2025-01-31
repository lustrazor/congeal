import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await prisma.$transaction(async (tx) => {
      // Get actual table names from SQLite
      const tables = await tx.$queryRaw<Array<{name: string}>>`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT IN ('User', 'Settings', '_prisma_migrations', 'sqlite_sequence')
        AND name NOT LIKE '_prisma_%'
      `

      console.log('Found tables:', tables)

      // Clear all content tables using raw SQL to handle both legacy and new data
      for (const table of tables) {
        const tableName = table.name
        try {
          // Delete all rows
          await tx.$executeRawUnsafe(`DELETE FROM "${tableName}"`)
          console.log(`Cleared table: ${tableName}`)

          // Reset SQLite sequence
          await tx.$executeRawUnsafe(`
            UPDATE sqlite_sequence 
            SET seq = 0 
            WHERE name = '${tableName}'
          `)
          console.log(`Reset sequence for: ${tableName}`)

          // Verify table is empty
          const result = await tx.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          ) as Array<{count: number}>
          
          const count = Number(result[0]?.count || 0)
          console.log(`${tableName} count after reset:`, count)
          
          if (count > 0) {
            throw new Error(`Failed to clear table: ${tableName}`)
          }
        } catch (err) {
          console.error(`Error processing table ${tableName}:`, err)
          throw err
        }
      }

      console.log('Database content reset completed')
    })

    // Run VACUUM after transaction completes
    await prisma.$executeRaw`VACUUM`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Data reset failed:', error)
    return NextResponse.json(
      { error: 'Failed to reset data' },
      { status: 500 }
    )
  }
}
 