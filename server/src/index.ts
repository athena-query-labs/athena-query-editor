import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import express, { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { loadConfig } from './config.js'
import { createAthenaClient, createS3Client } from './aws.js'
import { createPool } from './db.js'
import { requireUser } from './middleware/auth.js'
import { createQueryRouter } from './routes/query.js'
import { createMetadataRouter } from './routes/metadata.js'
import { createHistoryRouter } from './routes/history.js'

const config = loadConfig()
const athena = createAthenaClient(config)
const s3 = createS3Client(config)
const pool = createPool()

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(requireUser)

const staticRoot = path.join(process.cwd(), 'public')
const staticIndex = path.join(staticRoot, 'index.html')
app.use(express.static(staticRoot))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/query', createQueryRouter(config, athena, s3, pool))
app.use('/api/metadata', createMetadataRouter(config, athena))
app.use('/api/history', createHistoryRouter(pool))

app.get('*', (_req, res) => {
  res.sendFile(staticIndex)
})

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[error] ${req.method} ${req.path}`, err)

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', issues: err.issues })
    return
  }

  const name = err instanceof Error ? err.name : undefined
  switch (name) {
    case 'InvalidRequestException':
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid request' })
      return
    case 'ResourceNotFoundException':
      res.status(404).json({ error: 'Resource not found' })
      return
    case 'AccessDeniedException':
      res.status(403).json({ error: 'Access denied (check server IAM permissions)' })
      return
    case 'TooManyRequestsException':
      res.setHeader('Retry-After', '5')
      res.status(429).json({ error: 'Athena rate limit reached, retry shortly' })
      return
    case 'InternalServerException':
      res.status(502).json({ error: 'Athena service unavailable' })
      return
  }

  res.status(500).json({ error: 'Internal error' })
})

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`)
})
