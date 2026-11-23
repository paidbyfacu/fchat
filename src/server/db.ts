// Postgres access. One interface for two engines:
//   - DATABASE_URL set       → real Postgres, such as Neon on Vercel, with node-postgres
//   - PGLITE_DIR=<folder>    → embedded PGlite for development, in .env.local, outside web/
//   - PGLITE_DIR=memory://   → in-memory PGlite for tests
// All code uses query() and tx(); never the driver directly.

import { mkdirSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

export type Row = Record<string, unknown>

export interface Db {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>
  /** Runs several statements without parameters, for migrations. */
  exec(sql: string): Promise<void>
  tx<T>(fn: (q: Db) => Promise<T>): Promise<T>
}

type Queryable = {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>
}

function wrap(q: Queryable, txFn: Db["tx"], exec: Db["exec"]): Db {
  return {
    async query<T extends Row>(sql: string, params: unknown[] = []) {
      const r = await q.query(sql, params)
      return r.rows as T[]
    },
    exec,
    tx: txFn,
  }
}

async function openPglite(dir: string): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite")
  if (dir !== "memory://") mkdirSync(dir, { recursive: true })
  const pg = dir === "memory://" ? new PGlite() : new PGlite(dir)
  await pg.waitReady
  const exec = async (sql: string) => {
    await pg.exec(sql)
  }
  // PGlite is a single connection: transactions are serialized on their own.
  const tx: Db["tx"] = (fn) =>
    pg.transaction((t) => {
      const nested: Db["tx"] = () => Promise.reject(new Error("nested tx"))
      const texec = async (s: string) => {
        await t.exec(s)
      }
      return fn(wrap(t, nested, texec))
    })
  return wrap(pg, tx, exec)
}

/**
 * Neon hands out the address with sslmode=require. node-postgres already treats it as
 * verify-full, but warns about it with a "SECURITY WARNING" on every start, which shows
 * up in red in the Vercel Logs as if it were an error. Asking for verify-full does the
 * same thing it does today and leaves no warning.
 */
export function pgConnectionString(url: string): string {
  try {
    const u = new URL(url)
    const mode = u.searchParams.get("sslmode")
    if (mode && ["prefer", "require", "verify-ca"].includes(mode) && !u.searchParams.has("uselibpqcompat")) {
      u.searchParams.set("sslmode", "verify-full")
      return u.toString()
    }
  } catch {
    // not a URL: used as is
  }
  return url
}

async function openPostgres(url: string): Promise<Db> {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: pgConnectionString(url), max: 5 })
  const exec = async (sql: string) => {
    await pool.query(sql)
  }
  const tx: Db["tx"] = async (fn) => {
    const client = await pool.connect()
    try {
      await client.query("begin")
      const res = await fn(
        wrap(client, () => Promise.reject(new Error("nested tx")), async (s) => {
          await client.query(s)
        }),
      )
      await client.query("commit")
      return res
    } catch (e) {
      await client.query("rollback")
      throw e
    } finally {
      client.release()
    }
  }
  return wrap(pool, tx, exec)
}

const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations")

// Migration lock. On the first visit to a new Vercel installation several functions
// start at once and all of them want to migrate the empty database: without this,
// the second one repeated the migration the first had already applied, failed with
// "column ... already exists" and the page showed "Internal Server Error". With the lock,
// the second waits for the first and then skips whatever was already applied.
const MIGRATIONS_LOCK = 7_316_204_118

export async function migrate(db: Db, dir = MIGRATIONS_DIR): Promise<string[]> {
  await db.tx(async (q) => {
    await q.query("select pg_advisory_xact_lock($1)", [MIGRATIONS_LOCK])
    await q.exec(`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`)
  })
  const done = new Set((await db.query<{ name: string }>("select name from _migrations")).map((r) => r.name))
  const applied: string[] = []
  for (const file of readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue
    const sql = readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf8")
    const ran = await db.tx(async (q) => {
      await q.query("select pg_advisory_xact_lock($1)", [MIGRATIONS_LOCK])
      // another function may have applied it while this one waited for the lock
      if ((await q.query("select 1 from _migrations where name = $1", [file])).length) return false
      await q.exec(sql)
      await q.query("insert into _migrations (name) values ($1)", [file])
      return true
    })
    if (ran) applied.push(file)
  }
  return applied
}

export async function openDb(opts: { url?: string; pgliteDir?: string } = {}): Promise<Db> {
  const url = opts.url ?? process.env.DATABASE_URL
  // The PGlite folder comes ONLY from the environment variable. If the code has the
  // path written in it, like path.join(process.cwd(), ...), Turbopack treats it as part
  // of the project, watches it, and every PGlite write reloads the page in a loop.
  const dir = opts.pgliteDir ?? process.env.PGLITE_DIR
  if (!url && !dir) throw new Error("Set DATABASE_URL for Postgres or PGLITE_DIR for development")
  const db = url ? await openPostgres(url) : await openPglite(dir!)
  await migrate(db)
  return db
}

// One instance per process, since the dev server reloads modules.
// If opening it fails, like a Neon database that is slow to wake up or two functions
// migrating at once on the first installation, the error is not kept: the next request
// tries again instead of failing until Vercel recycles the function.
const g = globalThis as unknown as { __db?: Promise<Db> }
export function getDb(): Promise<Db> {
  g.__db ??= openDb().catch((e) => {
    g.__db = undefined
    throw e
  })
  return g.__db
}
