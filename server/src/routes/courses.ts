import { Router } from 'express'
import fs from 'node:fs'
import { z } from 'zod'
import { prisma } from '../db.js'
import { auditLog } from '../auth.js'
import { requireAuth } from '../middleware/auth.js'
import { safeUploadPath } from '../middleware/upload.js'

export const coursesRouter = Router()

coursesRouter.use(requireAuth)

coursesRouter.get('/:slug', async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            materials: { orderBy: { order: 'asc' } },
            test: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  include: { options: { orderBy: { order: 'asc' } } },
                },
              },
            },
            progress: { where: { userId: req.user!.id } },
          },
        },
      },
    })

    if (!course) {
      res.status(404).json({ error: 'Course not found' })
      return
    }

    const assignment = await prisma.courseAssignment.findUnique({
      where: { userId_courseId: { userId: req.user!.id, courseId: course.id } },
    })

    if (!assignment && req.user!.role === 'employee') {
      res.status(403).json({ error: 'Course not assigned' })
      return
    }

    res.json({
      id: course.slug,
      titleRu: course.titleRu,
      titleKk: course.titleKk,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        order: lesson.order,
        titleRu: lesson.titleRu,
        titleKk: lesson.titleKk,
        durationSec: lesson.durationSec,
        completed: lesson.progress[0]?.completed ?? false,
        videoWatched: lesson.progress[0]?.videoWatched ?? false,
        materials: lesson.materials.map((m) => ({
          id: m.id,
          type: m.type,
          titleRu: m.titleRu,
          titleKk: m.titleKk,
          fileName: m.fileName,
        })),
        hasTest: !!lesson.test,
        testConfig: lesson.test
          ? {
              passScore: lesson.test.passScore,
              maxAttempts: lesson.test.maxAttempts,
              timeLimitMin: lesson.test.timeLimitMin,
            }
          : null,
      })),
    })
  } catch (err) {
    next(err)
  }
})

coursesRouter.post('/:slug/lessons/:lessonId/watch', async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.lessonId, course: { slug: req.params.slug } },
    })
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' })
      return
    }

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: req.user!.id, lessonId: lesson.id } },
      create: {
        userId: req.user!.id,
        lessonId: lesson.id,
        videoWatched: true,
        materialsViewed: true,
      },
      update: { videoWatched: true, materialsViewed: true },
    })

    await auditLog(req.user!.id, 'LESSON_VIDEO_WATCHED', lesson.id, req.ip)
    res.json({ progress })
  } catch (err) {
    next(err)
  }
})

coursesRouter.get('/materials/:materialId/download', async (req, res, next) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.materialId },
      include: { lesson: { include: { course: true } } },
    })

    if (!material?.filePath) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    const fullPath = safeUploadPath(material.filePath)
    // If filePath looks like a remote URL (Supabase public URL), redirect
    if (typeof material.filePath === 'string' && material.filePath.startsWith('http')) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId: req.user!.id, lessonId: material.lessonId },
        },
        create: {
          userId: req.user!.id,
          lessonId: material.lessonId,
          materialsViewed: true,
        },
        update: { materialsViewed: true },
      })

      res.redirect(material.filePath)
      return
    }

    if (!fullPath || !fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: req.user!.id, lessonId: material.lessonId },
      },
      create: {
        userId: req.user!.id,
        lessonId: material.lessonId,
        materialsViewed: true,
      },
      update: { materialsViewed: true },
    })

    res.download(fullPath, material.fileName ?? 'download')
  } catch (err) {
    next(err)
  }
})

const submitTestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      optionIds: z.array(z.string()).min(1),
    }),
  ),
})

coursesRouter.get('/:slug/lessons/:lessonId/test', async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.lessonId, course: { slug: req.params.slug } },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
        progress: { where: { userId: req.user!.id } },
      },
    })

    if (!lesson?.test) {
      res.status(404).json({ error: 'Test not found' })
      return
    }

    const progress = lesson.progress[0]
    if (lesson.test.requireMaterialView && !progress?.videoWatched) {
      res.status(403).json({ error: 'Complete lesson materials first' })
      return
    }

    const attemptCount = await prisma.testAttempt.count({
      where: { userId: req.user!.id, testId: lesson.test.id, finishedAt: { not: null } },
    })

    if (attemptCount >= lesson.test.maxAttempts) {
      res.status(403).json({ error: 'Max attempts reached' })
      return
    }

    const questions = lesson.test.questions.slice(0, lesson.test.questionsToShow).map((q) => ({
      id: q.id,
      type: q.type,
      textRu: q.textRu,
      textKk: q.textKk,
      options: q.options.map((o) => ({
        id: o.id,
        textRu: o.textRu,
        textKk: o.textKk,
      })),
    }))

    res.json({
      testId: lesson.test.id,
      passScore: lesson.test.passScore,
      timeLimitMin: lesson.test.timeLimitMin,
      attemptNumber: attemptCount + 1,
      questions,
    })
  } catch (err) {
    next(err)
  }
})

coursesRouter.post('/:slug/lessons/:lessonId/test/submit', async (req, res, next) => {
  try {
    const { answers } = submitTestSchema.parse(req.body)

    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.lessonId, course: { slug: req.params.slug } },
      include: {
        test: {
          include: {
            questions: { include: { options: true } },
          },
        },
        course: true,
        progress: { where: { userId: req.user!.id } },
      },
    })

    if (!lesson?.test) {
      res.status(404).json({ error: 'Test not found' })
      return
    }

    const progress = lesson.progress[0]
    if (lesson.test.requireMaterialView && !progress?.videoWatched) {
      res.status(403).json({ error: 'Complete lesson materials first' })
      return
    }

    const attemptCount = await prisma.testAttempt.count({
      where: { userId: req.user!.id, testId: lesson.test.id, finishedAt: { not: null } },
    })

    if (attemptCount >= lesson.test.maxAttempts) {
      res.status(403).json({ error: 'Max attempts reached' })
      return
    }

    let correct = 0
    const total = lesson.test.questions.length
    const answerResults: { questionId: string; optionIds: string; isCorrect: boolean }[] = []

    for (const question of lesson.test.questions) {
      const submitted = answers.find((a) => a.questionId === question.id)
      const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id).sort()
      const submittedIds = (submitted?.optionIds ?? []).slice().sort()
      const isCorrect =
        correctIds.length === submittedIds.length &&
        correctIds.every((id, i) => id === submittedIds[i])
      if (isCorrect) correct += 1
      answerResults.push({
        questionId: question.id,
        optionIds: JSON.stringify(submittedIds),
        isCorrect,
      })
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0
    const passed = score >= lesson.test.passScore

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: req.user!.id,
        testId: lesson.test.id,
        score,
        passed,
        finishedAt: new Date(),
        answers: { create: answerResults },
      },
    })

    if (passed) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: req.user!.id, lessonId: lesson.id } },
        create: {
          userId: req.user!.id,
          lessonId: lesson.id,
          videoWatched: true,
          materialsViewed: true,
          completed: true,
        },
        update: { completed: true },
      })

      const allLessons = await prisma.lesson.findMany({ where: { courseId: lesson.courseId } })
      const completedCount = await prisma.lessonProgress.count({
        where: {
          userId: req.user!.id,
          lessonId: { in: allLessons.map((l) => l.id) },
          completed: true,
        },
      })

      if (completedCount === allLessons.length) {
        await prisma.certificate.upsert({
          where: {
            userId_courseId: { userId: req.user!.id, courseId: lesson.courseId },
          },
          create: { userId: req.user!.id, courseId: lesson.courseId },
          update: {},
        })
      }
    }

    await auditLog(req.user!.id, 'TEST_SUBMITTED', `${lesson.id}:${score}%`, req.ip)

    res.json({
      attemptId: attempt.id,
      score,
      passed,
      correct,
      total,
      results: answerResults.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
      })),
    })
  } catch (err) {
    next(err)
  }
})
