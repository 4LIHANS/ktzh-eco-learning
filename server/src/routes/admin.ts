import { Router } from 'express'
import { z } from 'zod'
import type { MaterialType } from '@prisma/client'
import { prisma } from '../db.js'
import { auditLog } from '../auth.js'
import { requireAuth, requireAdminPanel, requireContentManager } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import { config } from '../config.js'
import { uploadFileFromDisk } from '../storageSupabase.js'

export const adminRouter = Router()

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value
}

adminRouter.use(requireAuth, requireAdminPanel)

adminRouter.get('/sections', async (_req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
      include: { courses: { orderBy: { order: 'asc' } } },
    })
    res.json({ sections })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/tests', async (_req, res, next) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        lesson: { include: { course: true } },
        _count: { select: { questions: true } },
      },
    })
    res.json({
      tests: tests.map((t) => ({
        id: t.id,
        lessonId: t.lessonId,
        courseRu: t.lesson.course.titleRu,
        courseKk: t.lesson.course.titleKk,
        lessonOrder: t.lesson.order,
        questionCount: t._count.questions,
        questionsToShow: t.questionsToShow,
        passScore: t.passScore,
        maxAttempts: t.maxAttempts,
        timeLimitMin: t.timeLimitMin,
      })),
    })
  } catch (err) {
    next(err)
  }
})

const materialSchema = z.object({
  titleRu: z.string().min(1).max(300),
  titleKk: z.string().min(1).max(300),
  sectionId: z.string(),
  courseSlug: z.string().optional(),
  materialType: z.enum(['VIDEO', 'PDF', 'DOCX', 'PPTX', 'LINK']),
  lessonOrder: z.coerce.number().int().min(1).default(1),
  durationSec: z.coerce.number().int().min(0).default(600),
  passScore: z.coerce.number().int().min(1).max(100).default(70),
  maxAttempts: z.coerce.number().int().min(1).max(10).default(3),
  timeLimitMin: z.coerce.number().int().min(1).max(180).default(30),
  questionCount: z.coerce.number().int().min(1).max(50).default(5),
})

adminRouter.post(
  '/materials',
  requireContentManager,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const data = materialSchema.parse(req.body)
      const section = await prisma.section.findUnique({ where: { id: data.sectionId } })
      if (!section) {
        res.status(400).json({ error: 'Invalid section' })
        return
      }

      let course = data.courseSlug
        ? await prisma.course.findUnique({ where: { slug: data.courseSlug } })
        : null

      if (!course) {
        const slug = data.titleRu
          .toLowerCase()
          .replace(/[^a-z0-9а-яё]+/gi, '-')
          .slice(0, 40) + '-' + Date.now()
        course = await prisma.course.create({
          data: {
            sectionId: section.id,
            slug,
            titleRu: data.titleRu,
            titleKk: data.titleKk,
            thumbColor: 'green',
          },
        })
      }

      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          titleRu: data.titleRu,
          titleKk: data.titleKk,
          order: data.lessonOrder,
          durationSec: data.durationSec,
        },
      })

      let remoteUrl: string | null = null
      if (req.file) {
        const localPath = path.join(config.uploadDir, req.file.filename)
        try {
          remoteUrl = await uploadFileFromDisk(localPath, req.file.filename, req.file.mimetype)
          await fs.unlink(localPath)
        } catch (err) {
          return next(err)
        }
      }

      await prisma.material.create({
        data: {
          lessonId: lesson.id,
          type: data.materialType as MaterialType,
          titleRu: data.titleRu,
          titleKk: data.titleKk,
          filePath: remoteUrl ?? req.file?.filename ?? null,
          fileName: req.file?.originalname ?? null,
          fileSize: req.file?.size ?? null,
          mimeType: req.file?.mimetype ?? null,
        },
      })

      await prisma.test.create({
        data: {
          lessonId: lesson.id,
          passScore: data.passScore,
          maxAttempts: data.maxAttempts,
          timeLimitMin: data.timeLimitMin,
          questionsToShow: data.questionCount,
        },
      })

      const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE', isBlocked: false } })
      for (const emp of employees) {
        await prisma.courseAssignment.upsert({
          where: { userId_courseId: { userId: emp.id, courseId: course.id } },
          create: { userId: emp.id, courseId: course.id },
          update: {},
        })
      }

      await auditLog(req.user!.id, 'MATERIAL_UPLOADED', lesson.id, req.ip)
      res.status(201).json({ courseId: course.slug, lessonId: lesson.id })
    } catch (err) {
      next(err)
    }
  },
)

const optionInputSchema = z.object({
  textRu: z.string().trim().min(1).max(500),
  textKk: z.string().trim().min(1).max(500),
  isCorrect: z.boolean(),
  order: z.number().int().min(1).optional(),
})

const questionInputSchema = z.object({
  type: z.enum(['SINGLE', 'MULTIPLE']).default('SINGLE'),
  textRu: z.string().trim().min(1).max(1000),
  textKk: z.string().trim().min(1).max(1000),
  order: z.number().int().min(1).optional(),
  options: z.array(optionInputSchema).min(2).max(10),
})

function validateQuestionOptions(type: 'SINGLE' | 'MULTIPLE', options: { isCorrect: boolean }[]) {
  const correctCount = options.filter((o) => o.isCorrect).length
  if (type === 'SINGLE' && correctCount !== 1) {
    return 'Single-choice question must have exactly one correct answer'
  }
  if (type === 'MULTIPLE' && correctCount < 1) {
    return 'Multiple-choice question must have at least one correct answer'
  }
  return null
}

function mapQuestion(q: {
  id: string
  type: string
  textRu: string
  textKk: string
  order: number
  options: { id: string; textRu: string; textKk: string; isCorrect: boolean; order: number }[]
}) {
  return {
    id: q.id,
    type: q.type,
    textRu: q.textRu,
    textKk: q.textKk,
    order: q.order,
    options: q.options.map((o) => ({
      id: o.id,
      textRu: o.textRu,
      textKk: o.textKk,
      isCorrect: o.isCorrect,
      order: o.order,
    })),
  }
}

adminRouter.get('/tests/:testId', async (req, res, next) => {
  try {
    const testId = param(req.params.testId)
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        lesson: { include: { course: true } },
        questions: {
          orderBy: { order: 'asc' },
          include: { options: { orderBy: { order: 'asc' } } },
        },
      },
    })

    if (!test) {
      res.status(404).json({ error: 'Test not found' })
      return
    }

    res.json({
      test: {
        id: test.id,
        lessonId: test.lessonId,
        passScore: test.passScore,
        maxAttempts: test.maxAttempts,
        timeLimitMin: test.timeLimitMin,
        questionsToShow: test.questionsToShow,
        requireMaterialView: test.requireMaterialView,
        courseRu: test.lesson.course.titleRu,
        courseKk: test.lesson.course.titleKk,
        courseSlug: test.lesson.course.slug,
        lessonOrder: test.lesson.order,
        lessonTitleRu: test.lesson.titleRu,
        lessonTitleKk: test.lesson.titleKk,
        questions: test.questions.map(mapQuestion),
      },
    })
  } catch (err) {
    next(err)
  }
})

const testPatchSchema = z.object({
  passScore: z.number().int().min(1).max(100).optional(),
  maxAttempts: z.number().int().min(1).max(10).optional(),
  timeLimitMin: z.number().int().min(1).max(180).optional(),
  questionsToShow: z.number().int().min(1).max(50).optional(),
  requireMaterialView: z.boolean().optional(),
})

adminRouter.patch('/tests/:testId', requireContentManager, async (req, res, next) => {
  try {
    const testId = param(req.params.testId)
    const data = testPatchSchema.parse(req.body)
    const existing = await prisma.test.findUnique({ where: { id: testId } })
    if (!existing) {
      res.status(404).json({ error: 'Test not found' })
      return
    }

    const test = await prisma.test.update({
      where: { id: testId },
      data,
    })

    await auditLog(req.user!.id, 'TEST_UPDATED', test.id, req.ip)
    res.json({ test })
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/tests/:testId/questions', requireContentManager, async (req, res, next) => {
  try {
    const testId = param(req.params.testId)
    const data = questionInputSchema.parse(req.body)
    const validationError = validateQuestionOptions(data.type, data.options)
    if (validationError) {
      res.status(400).json({ error: validationError })
      return
    }

    const test = await prisma.test.findUnique({ where: { id: testId } })
    if (!test) {
      res.status(404).json({ error: 'Test not found' })
      return
    }

    const questionCount = await prisma.question.count({ where: { testId: test.id } })
    const order = data.order ?? questionCount + 1
    const question = await prisma.question.create({
      data: {
        testId: test.id,
        type: data.type,
        textRu: data.textRu,
        textKk: data.textKk,
        order,
        options: {
          create: data.options.map((opt, index) => ({
            textRu: opt.textRu,
            textKk: opt.textKk,
            isCorrect: opt.isCorrect,
            order: opt.order ?? index + 1,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    })

    await auditLog(req.user!.id, 'QUESTION_CREATED', question.id, req.ip)
    res.status(201).json({ question: mapQuestion(question) })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/questions/:questionId', requireContentManager, async (req, res, next) => {
  try {
    const questionId = param(req.params.questionId)
    const data = questionInputSchema.parse(req.body)
    const validationError = validateQuestionOptions(data.type, data.options)
    if (validationError) {
      res.status(400).json({ error: validationError })
      return
    }

    const existing = await prisma.question.findUnique({ where: { id: questionId } })
    if (!existing) {
      res.status(404).json({ error: 'Question not found' })
      return
    }

    const question = await prisma.$transaction(async (tx) => {
      await tx.answerOption.deleteMany({ where: { questionId: existing.id } })
      return tx.question.update({
        where: { id: existing.id },
        data: {
          type: data.type,
          textRu: data.textRu,
          textKk: data.textKk,
          order: data.order ?? existing.order,
          options: {
            create: data.options.map((opt, index) => ({
              textRu: opt.textRu,
              textKk: opt.textKk,
              isCorrect: opt.isCorrect,
              order: opt.order ?? index + 1,
            })),
          },
        },
        include: { options: { orderBy: { order: 'asc' } } },
      })
    })

    await auditLog(req.user!.id, 'QUESTION_UPDATED', question.id, req.ip)
    res.json({ question: mapQuestion(question) })
  } catch (err) {
    next(err)
  }
})

adminRouter.delete('/questions/:questionId', requireContentManager, async (req, res, next) => {
  try {
    const questionId = param(req.params.questionId)
    const existing = await prisma.question.findUnique({ where: { id: questionId } })
    if (!existing) {
      res.status(404).json({ error: 'Question not found' })
      return
    }

    await prisma.question.delete({ where: { id: existing.id } })
    await auditLog(req.user!.id, 'QUESTION_DELETED', existing.id, req.ip)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/settings', async (_req, res, next) => {
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: {},
      update: {},
    })
    res.json({ settings })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/settings', requireContentManager, async (req, res, next) => {
  try {
    const patch = z
      .object({
        emailNotifications: z.boolean().optional(),
        ssoEnabled: z.boolean().optional(),
        backupEnabled: z.boolean().optional(),
      })
      .parse(req.body)

    const settings = await prisma.platformSettings.update({
      where: { id: 'default' },
      data: patch,
    })
    await auditLog(req.user!.id, 'SETTINGS_UPDATED', JSON.stringify(patch), req.ip)
    res.json({ settings })
  } catch (err) {
    next(err)
  }
})
