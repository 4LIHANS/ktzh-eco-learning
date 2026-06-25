import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import multer from 'multer'
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, config } from '../config.js'

fs.mkdirSync(config.uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${crypto.randomUUID()}${ext}`)
  },
})

function validateFile(file: Express.Multer.File) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Invalid file type')
  }
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    throw new Error('Invalid file type')
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    try {
      validateFile(file)
      cb(null, true)
    } catch (err) {
      cb(err as Error)
    }
  },
})

export function safeUploadPath(storedName: string): string | null {
  const base = path.basename(storedName)
  if (base !== storedName || base.includes('..')) return null
  const full = path.join(config.uploadDir, base)
  if (!full.startsWith(config.uploadDir)) return null
  return full
}
