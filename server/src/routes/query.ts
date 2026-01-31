import { Router } from 'express'
import { z } from 'zod'
import {
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  StopQueryExecutionCommand,
} from '@aws-sdk/client-athena'
import { AthenaClient } from '@aws-sdk/client-athena'
import { Pool } from 'pg'
import { AppConfig } from '../config.js'
import { estimateCostUSD, formatGB, formatSeconds } from '../pricing.js'
import { insertQuery } from '../history.js'
import { objectExists, parseS3Url, presignGetObject } from '../s3.js'
import { S3Client } from '@aws-sdk/client-s3'

const startSchema = z.object({
  sql: z.string().min(1),
  catalog: z.string().optional(),
  database: z.string().optional(),
})

const resultsSchema = z.object({
  nextToken: z.string().optional(),
  maxResults: z.number().int().min(1).max(1000).optional(),
})

export function createQueryRouter(
  config: AppConfig,
  athena: AthenaClient,
  s3: S3Client,
  pool: Pool
) {
  const router = Router()

  router.post('/', async (req, res, next) => {
    try {
      const body = startSchema.parse(req.body)
      const queryExecutionContext = {
        Catalog: body.catalog ?? config.defaultCatalog,
        Database: body.database ?? config.defaultDatabase,
      }

      const command = new StartQueryExecutionCommand({
        QueryString: body.sql,
        QueryExecutionContext: queryExecutionContext,
        ResultConfiguration: {
          OutputLocation: config.outputLocation,
        },
        WorkGroup: config.workgroup,
      })

      const result = await athena.send(command)
      if (!result.QueryExecutionId) {
        res.status(500).json({ error: 'Missing query execution id' })
        return
      }

      await insertQuery(pool, {
        userEmail: req.userEmail!,
        queryExecutionId: result.QueryExecutionId,
        sqlText: body.sql,
        status: 'QUEUED',
        submittedAt: new Date(),
        workgroup: config.workgroup,
        catalog: queryExecutionContext.Catalog,
        databaseName: queryExecutionContext.Database,
      })

      res.json({ queryId: result.QueryExecutionId })
    } catch (err) {
      next(err)
    }
  })

  router.get('/:id', async (req, res, next) => {
    try {
      const command = new GetQueryExecutionCommand({ QueryExecutionId: req.params.id })
      const result = await athena.send(command)
      const execution = result.QueryExecution
      if (!execution || !execution.Status) {
        res.status(404).json({ error: 'Query not found' })
        return
      }
      const stats = execution.Statistics
      let state = execution.Status.State ?? 'UNKNOWN'
      const submittedAt = execution.Status.SubmissionDateTime
      if ((state === 'QUEUED' || state === 'RUNNING') && submittedAt) {
        const ageMs = Date.now() - submittedAt.getTime()
        if (ageMs > 24 * 60 * 60 * 1000) {
          await athena.send(new StopQueryExecutionCommand({ QueryExecutionId: req.params.id }))
          state = 'TIMEOUT'
        }
      }
      const scannedBytes = stats?.DataScannedInBytes ?? null
      const queueTimeMs = stats?.QueryQueueTimeInMillis ?? null
      const executionTimeMs = stats?.EngineExecutionTimeInMillis ?? stats?.TotalExecutionTimeInMillis ?? null

      const cost = estimateCostUSD(config, scannedBytes)

      await insertQuery(pool, {
        userEmail: req.userEmail!,
        queryExecutionId: req.params.id,
        sqlText: execution.Query ?? '',
        status: state,
        submittedAt: execution.Status.SubmissionDateTime ?? new Date(),
        completedAt: execution.Status.CompletionDateTime ?? null,
        errorMessage: execution.Status.StateChangeReason ?? null,
        scannedBytes,
        queueTimeMs,
        executionTimeMs,
        estimatedCostUsd: cost?.currency === 'USD' ? cost.amount : null,
        outputLocation: execution.ResultConfiguration?.OutputLocation ?? null,
        workgroup: execution.WorkGroup ?? config.workgroup,
        catalog: execution.QueryExecutionContext?.Catalog ?? config.defaultCatalog,
        databaseName: execution.QueryExecutionContext?.Database ?? null,
      })

      res.json({
        queryId: req.params.id,
        state,
        statusReason: execution.Status.StateChangeReason ?? null,
        stats: {
          queueTimeSeconds: formatSeconds(queueTimeMs),
          executionTimeSeconds: formatSeconds(executionTimeMs),
          scannedGB: formatGB(scannedBytes),
          estimatedCost: cost ?? null,
        },
        submittedAt: submittedAt ?? null,
        completedAt: execution.Status.CompletionDateTime ?? null,
      })
    } catch (err) {
      next(err)
    }
  })

  router.get('/:id/results', async (req, res, next) => {
    try {
      const query = resultsSchema.parse({
        nextToken: req.query.nextToken,
        maxResults: req.query.maxResults ? Number(req.query.maxResults) : undefined,
      })

      const maxResults = query.maxResults ?? 100

      const command = new GetQueryResultsCommand({
        QueryExecutionId: req.params.id,
        NextToken: query.nextToken,
        MaxResults: maxResults,
      })
      const result = await athena.send(command)
      const rows = result.ResultSet?.Rows ?? []
      const columns = result.ResultSet?.ResultSetMetadata?.ColumnInfo ?? []

      const dataRows = rows.length > 0 && !query.nextToken ? rows.slice(1) : rows
      const values = dataRows.map((row) => (row.Data ?? []).map((cell) => cell.VarCharValue ?? ''))

      res.json({
        columns: columns.map((col) => ({
          name: col.Name ?? '',
          type: col.Type ?? '',
        })),
        rows: values,
        nextToken: result.NextToken ?? null,
      })
    } catch (err) {
      next(err)
    }
  })

  router.post('/:id/cancel', async (req, res, next) => {
    try {
      await athena.send(new StopQueryExecutionCommand({ QueryExecutionId: req.params.id }))
      res.json({ status: 'CANCELLED' })
    } catch (err) {
      next(err)
    }
  })

  router.get('/:id/download', async (req, res, next) => {
    try {
      const exec = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: req.params.id }))
      const execution = exec.QueryExecution
      if (!execution) {
        res.status(404).json({ error: 'Query not found' })
        return
      }
      const outputLocation = execution.ResultConfiguration?.OutputLocation
      if (!outputLocation) {
        res.json({ available: false })
        return
      }
      let { bucket, key } = parseS3Url(outputLocation)
      if (key.endsWith('/')) {
        key = `${key}${execution.QueryExecutionId}.csv`
      } else if (!key.endsWith('.csv') && !key.endsWith('.txt')) {
        key = `${key}/${execution.QueryExecutionId}.csv`
      }
      const exists = await objectExists(s3, bucket, key)
      if (!exists) {
        res.json({ available: false })
        return
      }

      const filename = `${execution.QueryExecutionId}.csv`
      const url = await presignGetObject(s3, bucket, key, 60 * 60 * 24, filename)

      const state = execution.Status?.State ?? 'UNKNOWN'
      const partial = state === 'FAILED' || state === 'CANCELLED'

      res.json({ available: true, url, filename, partial })
    } catch (err) {
      next(err)
    }
  })

  return router
}
