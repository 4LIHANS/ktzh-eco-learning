import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log('DB connected')
    const user = await prisma.user.findFirst()
    console.log('First user:', user)
    const loginUser = await prisma.user.findUnique({ where: { login: 'admin' } })
    console.log('Admin user:', loginUser)
  } catch (e) {
    console.error('ERROR', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
