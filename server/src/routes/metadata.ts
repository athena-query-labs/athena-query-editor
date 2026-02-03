import { Router } from 'express'
import { AthenaClient, ListDatabasesCommand, ListTableMetadataCommand, GetTableMetadataCommand } from '@aws-sdk/client-athena'
import { AppConfig } from '../config.js'

export function createMetadataRouter(config: AppConfig, athena: AthenaClient) {
  const router = Router()

  router.get('/catalogs', async (_req, res, next) => {
    try {
      res.json({ catalogs: [config.defaultCatalog] })
    } catch (err) {
      next(err)
    }
  })

  router.get('/databases', async (_req, res, next) => {
    try {
      const databases: string[] = []
      let nextToken: string | undefined
      do {
        const result = await athena.send(
          new ListDatabasesCommand({
            CatalogName: config.defaultCatalog,
            NextToken: nextToken,
          })
        )
        databases.push(
          ...(result.DatabaseList ?? []).map((db) => db.Name).filter(Boolean)
        )
        nextToken = result.NextToken
      } while (nextToken)
      res.json({ databases })
    } catch (err) {
      next(err)
    }
  })

  router.get('/tables', async (req, res, next) => {
    try {
      const database = String(req.query.database || '')
      if (!database) {
        res.status(400).json({ error: 'database is required' })
        return
      }
      const result = await athena.send(
        new ListTableMetadataCommand({
          CatalogName: config.defaultCatalog,
          DatabaseName: database,
          MaxResults: 50,
        })
      )
      const tables = (result.TableMetadataList ?? []).map((tbl) => tbl.Name).filter(Boolean)
      res.json({ tables })
    } catch (err) {
      next(err)
    }
  })

  router.get('/columns', async (req, res, next) => {
    try {
      const database = String(req.query.database || '')
      const table = String(req.query.table || '')
      if (!database || !table) {
        res.status(400).json({ error: 'database and table are required' })
        return
      }
      const result = await athena.send(
        new GetTableMetadataCommand({
          CatalogName: config.defaultCatalog,
          DatabaseName: database,
          TableName: table,
        })
      )
      const columns = (result.TableMetadata?.Columns ?? []).map((col) => ({
        name: col.Name ?? '',
        type: col.Type ?? '',
        comment: col.Comment ?? '',
      }))
      res.json({ columns })
    } catch (err) {
      next(err)
    }
  })

  return router
}
