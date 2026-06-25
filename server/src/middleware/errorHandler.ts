import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.flatten() })
    return
  }

  if (err instanceof Error && err.message === 'Invalid file type') {
    res.status(400).json({ error: err.message })
    return
  }

  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
