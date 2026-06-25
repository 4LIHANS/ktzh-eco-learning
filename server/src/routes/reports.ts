import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { auditLog } from '../auth.js'
import { canViewAllReports, requireAuth, requireReportsAccess } from '../middleware/auth.js'

export const reportsRouter = Router()

reportsRouter.use(requireAuth, requireReportsAccess)

reportsRouter.get('/summary', async (req, res, next) => {
  try {
    const role = req.user!.role.toUpperCase() as 'ADMIN' | 'METHODIST' | 'MANAGER' | 'EMPLOYEE'
    const departmentFilter =
      !canViewAllReports(role) ? req.user!.department : undefined

    const userWhere: Prisma.UserWhereInput = {
      role: 'EMPLOYEE',
      isBlocked: false,
      ...(departmentFilter ? { department: departmentFilter } : {}),
    }

    const employees = await prisma.user.findMany({ where: userWhere, select: { id: true, department: true } })
    const employeeIds = employees.map((e) => e.id)

    const assignments = await prisma.courseAssignment.findMany({
      where: { userId: { in: employeeIds } },
      include: {
        course: { include: { lessons: true } },
        user: true,
      },
    })

    let trained = 0
    for (const user of employees) {
      const userAssignments = assignments.filter((a) => a.userId === user.id)
      let allComplete = userAssignments.length > 0
      for (const assignment of userAssignments) {
        const lessonIds = assignment.course.lessons.map((l) => l.id)
        const done = await prisma.lessonProgress.count({
          where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
        })
        if (done < lessonIds.length) {
          allComplete = false
          break
        }
      }
      if (allComplete) trained += 1
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId: { in: employeeIds }, finishedAt: { not: null } },
    })
    const avgScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : 0

    const departments = ['Алматы', 'Астана', 'Шымкент', 'Актобе']
    const departmentCoverage = await Promise.all(
      departments.map(async (dept) => {
        const deptUsers = employees.filter((e) => e.department === dept)
        if (deptUsers.length === 0) return { department: dept, coverage: 0 }
        let deptTrained = 0
        for (const user of deptUsers) {
          const userAssignments = assignments.filter((a) => a.userId === user.id)
          let complete = userAssignments.length > 0
          for (const assignment of userAssignments) {
            const lessonIds = assignment.course.lessons.map((l) => l.id)
            const done = await prisma.lessonProgress.count({
              where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
            })
            if (done < lessonIds.length) complete = false
          }
          if (complete) deptTrained += 1
        }
        return {
          department: dept,
          coverage: Math.round((deptTrained / deptUsers.length) * 100),
        }
      }),
    )

    const recentAttempts = await prisma.testAttempt.findMany({
      where: { userId: { in: employeeIds }, finishedAt: { not: null } },
      include: {
        user: true,
        test: { include: { lesson: { include: { course: true } } } },
      },
      orderBy: { finishedAt: 'desc' },
      take: 10,
    })

    res.json({
      employees: employees.length,
      trained,
      coverage: employees.length > 0 ? Math.round((trained / employees.length) * 100) : 0,
      avgScore,
      departmentCoverage,
      recentResults: recentAttempts.map((a) => ({
        employee: a.user.fullName,
        courseRu: a.test.lesson.course.titleRu,
        courseKk: a.test.lesson.course.titleKk,
        score: `${a.score}%`,
        status: a.passed ? 'passed' : 'failed',
      })),
    })
  } catch (err) {
    next(err)
  }
})

reportsRouter.get('/export', async (req, res, next) => {
  try {
    const format = z.enum(['csv']).parse(req.query.format ?? 'csv')
    const summary = await prisma.testAttempt.findMany({
      include: {
        user: true,
        test: { include: { lesson: { include: { course: true } } } },
      },
      orderBy: { finishedAt: 'desc' },
      take: 500,
    })

    if (format === 'csv') {
      const header = 'Employee,Course,Score,Passed,Date\n'
      const rows = summary
        .map(
          (a) =>
            `"${a.user.fullName}","${a.test.lesson.course.titleRu}",${a.score},${a.passed},${a.finishedAt?.toISOString() ?? ''}`,
        )
        .join('\n')
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"')
      res.send('\uFEFF' + header + rows)
      await auditLog(req.user!.id, 'REPORT_EXPORT', 'csv', req.ip)
    }
  } catch (err) {
    next(err)
  }
})
