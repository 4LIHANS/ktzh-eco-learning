import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { config } from './config.js'
import { prisma } from './db.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { authRouter } from './routes/auth.js'
import { dashboardRouter } from './routes/dashboard.js'
import { coursesRouter } from './routes/courses.js'
import { reportsRouter } from './routes/reports.js'
import { usersRouter } from './routes/users.js'
import { adminRouter } from './routes/admin.js'

const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: config.isProduction ? undefined : false,
  }),
)

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts' },
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/login', authLimiter)
app.use('/api', apiLimiter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv })
})

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const users = await prisma.user.count()
    res.json({ status: 'ok', users })
  } catch (err) {
    console.error('DB health check failed:', err)
    res.status(503).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Database unavailable',
    })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/users', usersRouter)
app.use('/api/admin', adminRouter)

if (config.isProduction) {
  const distPath = path.join(config.rootDir, 'dist')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }
}

app.use(notFound)
app.use(errorHandler)

app.listen(config.port, config.host, () => {
  console.log(`KTZH Eco Learning API on http://${config.host}:${config.port}`)
})
