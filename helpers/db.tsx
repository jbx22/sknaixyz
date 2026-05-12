import { Kysely, CamelCasePlugin } from 'kysely'
import { PostgresJSDialect } from 'kysely-postgres-js'
import { DB } from './schema'
import postgres from 'postgres'

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.FLOOT_DATABASE_URL

if (!databaseUrl && typeof window === 'undefined') {
  console.warn('[SKNAI] No Postgres connection string found. Set DATABASE_URL or POSTGRES_URL in Vercel. Demo UI routes still work, but database-backed APIs will return DB configuration errors.')
}

const sql = databaseUrl
  ? postgres(databaseUrl, {
      prepare: false,
      idle_timeout: 20,
      max: Number(process.env.DB_POOL_MAX || (process.env.VERCEL ? 3 : 10)),
      ssl: process.env.DB_SSL === 'false' ? false : 'require',
    })
  : postgres('postgres://missing:missing@127.0.0.1:1/missing', {
      prepare: false,
      idle_timeout: 1,
      connect_timeout: 1,
      max: 1,
    })

export const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresJSDialect({ postgres: sql }),
})

export function hasDatabaseUrl() {
  return Boolean(databaseUrl)
}

export function requireDatabaseUrl() {
  if (!databaseUrl) {
    throw new Error('Database is not configured. Set DATABASE_URL or POSTGRES_URL in Vercel. Supabase is not required.')
  }
}
