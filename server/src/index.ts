import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { config } from './config.js'
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

app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/users', usersRouter)
app.use('/api/admin', adminRouter)

if (config.isProduction) {
  const distPath = path.join(config.rootDir, 'dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`KTZH Eco Learning API on http://localhost:${config.port}`)
})
