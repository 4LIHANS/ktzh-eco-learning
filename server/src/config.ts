import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../..')

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: '8h',
  cookieName: 'ktzh_session',
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR ?? 'uploads'),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 2_147_483_648),
  isProduction: process.env.NODE_ENV === 'production',
  rootDir,
}

export const ALLOWED_MIME_TYPES = new Set([
  'video/mp4',
  'video/x-msvideo',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-powerpoint',
])

export const ALLOWED_EXTENSIONS = new Set(['.mp4', '.avi', '.pdf', '.docx', '.pptx', '.doc', '.ppt'])
