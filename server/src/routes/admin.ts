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
        courseRu: t.lesson.course.titleRu,
        courseKk: t.lesson.course.titleKk,
        lessonOrder: t.lesson.order,
        questionCount: t._count.questions,
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
