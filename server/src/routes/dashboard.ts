import { Router } from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth)

dashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const userId = req.user!.id
    const assignments = await prisma.courseAssignment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: {
              include: { progress: { where: { userId } } },
            },
          },
        },
      },
    })

    let totalLessons = 0
    let completedLessons = 0

    for (const assignment of assignments) {
      for (const lesson of assignment.course.lessons) {
        totalLessons += 1
        const prog = lesson.progress[0]
        if (prog?.completed) completedLessons += 1
      }
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId, finishedAt: { not: null } },
    })
    const avgScore =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
        : 0

    const courseStats = await Promise.all(
      assignments.map(async (a) => {
        const lessonCount = a.course.lessons.length
        const done = a.course.lessons.filter((l) => l.progress[0]?.completed).length
        const progress = lessonCount > 0 ? Math.round((done / lessonCount) * 100) : 0
        return {
          id: a.course.slug,
          courseId: a.course.id,
          titleRu: a.course.titleRu,
          titleKk: a.course.titleKk,
          lessons: lessonCount,
          durationMin: Math.round(
            a.course.lessons.reduce((s, l) => s + l.durationSec, 0) / 60,
          ),
          progress,
          thumbColor: a.course.thumbColor,
          icon: a.course.icon,
          iconColor: a.course.iconColor,
          status: progress === 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted',
        }
      }),
    )

    const unfinished = courseStats.filter((c) => c.progress < 100).length

    res.json({
      totalCourses: assignments.length,
      completedCourses: courseStats.filter((c) => c.progress === 100).length,
      inProgressCourses: courseStats.filter((c) => c.progress > 0 && c.progress < 100).length,
      avgScore,
      unfinished,
      courses: courseStats,
    })
  } catch (err) {
    next(err)
  }
})

dashboardRouter.get('/notifications', async (req, res, next) => {
  try {
    const items = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

dashboardRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

dashboardRouter.get('/certificates', async (req, res, next) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({
      items: certs.map((c) => ({
        id: c.id,
        courseId: c.course.slug,
        titleRu: c.course.titleRu,
        titleKk: c.course.titleKk,
        issuedAt: c.issuedAt.toISOString().slice(0, 10),
      })),
    })
  } catch (err) {
    next(err)
  }
})

dashboardRouter.get('/results', async (req, res, next) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user!.id, finishedAt: { not: null } },
      include: {
        test: {
          include: {
            lesson: { include: { course: true } },
          },
        },
      },
      orderBy: { finishedAt: 'desc' },
    })

    res.json({
      items: attempts.map((a, index) => ({
        id: a.id,
        courseTitleRu: a.test.lesson.course.titleRu,
        courseTitleKk: a.test.lesson.course.titleKk,
        lessonOrder: a.test.lesson.order,
        score: a.score,
        passed: a.passed,
        attempt: attempts.filter((x) => x.testId === a.testId).length - index,
        date: a.finishedAt!.toISOString().slice(0, 10),
      })),
    })
  } catch (err) {
    next(err)
  }
})
