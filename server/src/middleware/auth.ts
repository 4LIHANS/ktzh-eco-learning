import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@prisma/client'
import { getUserFromRequest } from '../auth.js'
import type { AuthUser } from '../types.js'
import {
  canAccessAdminPanel,
  canManageContent,
  canManageUsers,
  canViewAllReports,
  canViewDepartmentReports,
} from '../types.js'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  getUserFromRequest(req)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      req.user = user
      next()
    })
    .catch(next)
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const dbRole = req.user.role.toUpperCase() as Role
    if (!roles.includes(dbRole)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    next()
  }
}

export function requireAdminPanel(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const role = req.user.role.toUpperCase() as Role
  if (!canAccessAdminPanel(role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function requireContentManager(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const role = req.user.role.toUpperCase() as Role
  if (!canManageContent(role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function requireUserManager(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const role = req.user.role.toUpperCase() as Role
  if (!canManageUsers(role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export function requireReportsAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const role = req.user.role.toUpperCase() as Role
  if (!canViewDepartmentReports(role)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

export { canViewAllReports }
