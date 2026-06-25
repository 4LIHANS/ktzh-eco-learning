import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { auditLog, getUserFromRequest, signToken } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'

const loginSchema = z.object({
  login: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
})

export const authRouter = Router()

authRouter.post('/login', async (req, res, next) => {
  try {
    const { login, password } = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { login: login.toLowerCase() } })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = await signToken(user.id, user.role)
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    })

    await auditLog(user.id, 'LOGIN', undefined, req.ip)

    res.json({
      user: {
        id: user.id,
        login: user.login,
        fullName: user.fullName,
        firstName: user.firstName,
        initials: user.initials,
        department: user.department,
        role: user.role.toLowerCase() as 'admin' | 'methodist' | 'manager' | 'employee',
        preferredLang: user.preferredLang,
      },
    })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await auditLog(req.user!.id, 'LOGOUT', undefined, req.ip)
    res.clearCookie(config.cookieName, { path: '/' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

authRouter.get('/me', async (req, res, next) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

authRouter.patch('/language', requireAuth, async (req, res, next) => {
  try {
    const lang = z.enum(['ru', 'kk']).parse(req.body.lang)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { preferredLang: lang },
    })
    res.json({ preferredLang: lang })
  } catch (err) {
    next(err)
  }
})
