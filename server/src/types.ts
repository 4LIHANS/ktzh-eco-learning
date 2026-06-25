import type { Role } from '@prisma/client'

export type AppRole = 'admin' | 'methodist' | 'manager' | 'employee'

export function toAppRole(role: Role): AppRole {
  switch (role) {
    case 'ADMIN':
      return 'admin'
    case 'METHODIST':
      return 'methodist'
    case 'MANAGER':
      return 'manager'
    default:
      return 'employee'
  }
}

export function canAccessAdminPanel(role: Role): boolean {
  return role === 'ADMIN' || role === 'METHODIST'
}

export function canManageContent(role: Role): boolean {
  return role === 'ADMIN' || role === 'METHODIST'
}

export function canManageUsers(role: Role): boolean {
  return role === 'ADMIN'
}

export function canViewAllReports(role: Role): boolean {
  return role === 'ADMIN' || role === 'METHODIST'
}

export function canViewDepartmentReports(role: Role): boolean {
  return role === 'MANAGER' || canViewAllReports(role)
}

export interface AuthUser {
  id: string
  login: string
  fullName: string
  firstName: string
  initials: string
  department: string
  role: AppRole
  preferredLang: string
}

export interface JwtPayload {
  sub: string
  role: Role
}
