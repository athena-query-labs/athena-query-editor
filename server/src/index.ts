import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import { loadConfig } from './config.js'
import { createAthenaClient, createS3Client } from './aws.js'
import { createPool } from './db.js'
import { requireUser } from './middleware/auth.js'
import { createQueryRouter } from './routes/query.js'
import { createMetadataRouter } from './routes/metadata.js'

const config = loadConfig()
const athena = createAthenaClient(config)
const s3 = createS3Client(config)
const pool = createPool()

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(requireUser)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/query', createQueryRouter(config, athena, s3, pool))
app.use('/api/metadata', createMetadataRouter(config, athena))

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error'
  res.status(500).json({ error: message })
})

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`)
})
