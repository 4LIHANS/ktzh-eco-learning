import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db.js'
import { auditLog } from '../auth.js'
import { requireAuth, requireUserManager } from '../middleware/auth.js'

export const usersRouter = Router()

usersRouter.use(requireAuth, requireUserManager)

usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        login: true,
        fullName: true,
        department: true,
        role: true,
        isBlocked: true,
      },
    })
    res.json({ users })
  } catch (err) {
    next(err)
  }
})

const createUserSchema = z.object({
  login: z.string().trim().min(3).max(100),
  password: z.string().min(8).max(200),
  fullName: z.string().trim().min(1).max(200),
  firstName: z.string().trim().min(1).max(100),
  initials: z.string().trim().min(1).max(10),
  department: z.string().trim().min(1).max(100),
  role: z.enum(['ADMIN', 'METHODIST', 'MANAGER', 'EMPLOYEE']),
})

usersRouter.post('/', async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        login: data.login.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        firstName: data.firstName,
        initials: data.initials,
        department: data.department,
        role: data.role,
      },
    })
    await auditLog(req.user!.id, 'USER_CREATED', user.id, req.ip)
    res.status(201).json({ id: user.id })
  } catch (err) {
    next(err)
  }
})

usersRouter.patch('/:id', async (req, res, next) => {
  try {
    const patch = z
      .object({
        isBlocked: z.boolean().optional(),
        role: z.enum(['ADMIN', 'METHODIST', 'MANAGER', 'EMPLOYEE']).optional(),
        department: z.string().optional(),
      })
      .parse(req.body)

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: patch,
    })
    await auditLog(req.user!.id, 'USER_UPDATED', user.id, req.ip)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})
