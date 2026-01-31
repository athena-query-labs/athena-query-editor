import { Pool } from 'pg'

export function createPool() {
  const connectionString = process.env.DATABASE_URL
  return new Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST,
          port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
        }
  )
}
