import type { Request } from 'express'
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { config } from './config.js'
import { prisma } from './db.js'
import type { AuthUser, JwtPayload } from './types.js'
import { toAppRole } from './types.js'

export async function signToken(userId: string, role: string): Promise<string> {
  const sign = jwt.sign as (payload: any, secret: any, options: SignOptions) => string
  return sign({ sub: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  })
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    return null
  }
}

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[config.cookieName]
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload?.sub) return null

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || user.isBlocked) return null

  return {
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    firstName: user.firstName,
    initials: user.initials,
    department: user.department,
    role: toAppRole(user.role),
    preferredLang: user.preferredLang,
  }
}

export async function auditLog(
  userId: string | null,
  action: string,
  details?: string,
  ip?: string,
) {
  await prisma.auditLog.create({
    data: { userId, action, details, ip },
  })
}
