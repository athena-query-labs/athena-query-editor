import { Pool } from 'pg'

export interface QueryHistoryRecord {
  userEmail: string
  queryExecutionId: string
  sqlText: string
  status: string
  submittedAt: Date
  completedAt?: Date | null
  errorMessage?: string | null
  scannedBytes?: number | null
  queueTimeMs?: number | null
  executionTimeMs?: number | null
  estimatedCostUsd?: number | null
  outputLocation?: string | null
  workgroup?: string | null
  catalog?: string | null
  databaseName?: string | null
  isPartial?: boolean | null
}

export async function insertQuery(pool: Pool, record: QueryHistoryRecord) {
  await pool.query(
    `insert into query_history
      (user_email, query_execution_id, sql_text, status, submitted_at, completed_at, error_message,
       scanned_bytes, queue_time_ms, execution_time_ms, estimated_cost_usd, output_location, workgroup,
       catalog, database_name, is_partial)
     values
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     on conflict (user_email, query_execution_id) do update
       set status = excluded.status,
           completed_at = excluded.completed_at,
           error_message = excluded.error_message,
           scanned_bytes = excluded.scanned_bytes,
           queue_time_ms = excluded.queue_time_ms,
           execution_time_ms = excluded.execution_time_ms,
           estimated_cost_usd = excluded.estimated_cost_usd,
           output_location = excluded.output_location,
           workgroup = excluded.workgroup,
           catalog = excluded.catalog,
           database_name = excluded.database_name,
           is_partial = excluded.is_partial,
           updated_at = now()
    `,
    [
      record.userEmail,
      record.queryExecutionId,
      record.sqlText,
      record.status,
      record.submittedAt,
      record.completedAt ?? null,
      record.errorMessage ?? null,
      record.scannedBytes ?? null,
      record.queueTimeMs ?? null,
      record.executionTimeMs ?? null,
      record.estimatedCostUsd ?? null,
      record.outputLocation ?? null,
      record.workgroup ?? null,
      record.catalog ?? null,
      record.databaseName ?? null,
      record.isPartial ?? null,
    ]
  )
}
