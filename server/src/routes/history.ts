import { Router } from 'express'
import { Pool } from 'pg'
import { z } from 'zod'
import { formatGB, formatSeconds } from '../pricing.js'

const querySchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
})

export function createHistoryRouter(pool: Pool) {
  const router = Router()

  router.get('/', async (req, res, next) => {
    try {
      const query = querySchema.parse({
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      })
      const result = await pool.query(
        `select
            user_email,
            query_execution_id,
            sql_text,
            status,
            submitted_at,
            completed_at,
            error_message,
            scanned_bytes,
            queue_time_ms,
            execution_time_ms,
            estimated_cost_usd,
            output_location,
            workgroup,
            catalog,
            database_name,
            is_partial
         from query_history
         where user_email = $1
         order by submitted_at desc
         limit $2 offset $3`,
        [req.userEmail, query.limit, query.offset]
      )

      const rows = result.rows.map((row) => ({
        ...row,
        stats: {
          queueTimeSeconds: formatSeconds(row.queue_time_ms),
          executionTimeSeconds: formatSeconds(row.execution_time_ms),
          scannedGB: formatGB(row.scanned_bytes),
          estimatedCost: row.estimated_cost_usd ? { amount: Number(row.estimated_cost_usd), currency: 'USD' } : null,
        },
      }))

      res.json({ items: rows, limit: query.limit, offset: query.offset })
    } catch (err) {
      next(err)
    }
  })

  return router
}
