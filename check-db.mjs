import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  await prisma.$connect()
  const tables = await prisma.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
  console.log('tables', tables)
} catch (err) {
  console.error('ERR', err)
} finally {
  await prisma.$disconnect()
}
