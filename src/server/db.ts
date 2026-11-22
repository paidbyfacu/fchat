// Acceso a Postgres. Una sola interfaz para dos motores:
//   - DATABASE_URL definida  → Postgres real, como Neon en Vercel, con node-postgres
//   - PGLITE_DIR=<carpeta>   → PGlite embebido (desarrollo; en .env.local, fuera de web/)
//   - PGLITE_DIR=memory://   → PGlite en memoria (tests)
// Todo el código usa query() y tx(); nunca el driver directo.

import { mkdirSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"

export type Row = Record<string, unknown>

export interface Db {
  query<T extends Row = Row>(sql: string, params?: unknown[]): Promise<T[]>
  /** Ejecuta varias sentencias sin parámetros (migraciones). */
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
  // PGlite es una sola conexión: las transacciones se serializan solas.
  const tx: Db["tx"] = (fn) =>
    pg.transaction((t) => {
      const nested: Db["tx"] = () => Promise.reject(new Error("tx anidada"))
      const texec = async (s: string) => {
        await t.exec(s)
      }
      return fn(wrap(t, nested, texec))
    })
  return wrap(pg, tx, exec)
}

async function openPostgres(url: string): Promise<Db> {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: url, max: 5 })
  const exec = async (sql: string) => {
    await pool.query(sql)
  }
  const tx: Db["tx"] = async (fn) => {
    const client = await pool.connect()
    try {
      await client.query("begin")
      const res = await fn(
        wrap(client, () => Promise.reject(new Error("tx anidada")), async (s) => {
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

export async function migrate(db: Db, dir = MIGRATIONS_DIR): Promise<string[]> {
  await db.exec(`create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())`)
  const done = new Set((await db.query<{ name: string }>("select name from _migrations")).map((r) => r.name))
  const applied: string[] = []
  for (const file of readdirSync(/*turbopackIgnore: true*/ dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue
    const sql = readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf8")
    await db.tx(async (q) => {
      await q.exec(sql)
      await q.query("insert into _migrations (name) values ($1)", [file])
    })
    applied.push(file)
  }
  return applied
}

export async function openDb(opts: { url?: string; pgliteDir?: string } = {}): Promise<Db> {
  const url = opts.url ?? process.env.DATABASE_URL
  // La carpeta de PGlite sale SOLO de la variable de entorno. Si el código tiene
  // la ruta escrita (path.join(process.cwd(), ...)), Turbopack la toma como parte
  // del proyecto, la vigila, y cada escritura de PGlite recarga la página en bucle.
  const dir = opts.pgliteDir ?? process.env.PGLITE_DIR
  if (!url && !dir) throw new Error("Define DATABASE_URL (Postgres) o PGLITE_DIR (desarrollo)")
  const db = url ? await openPostgres(url) : await openPglite(dir!)
  await migrate(db)
  return db
}

// Una sola instancia por proceso (el servidor de desarrollo recarga módulos).
const g = globalThis as unknown as { __db?: Promise<Db> }
export function getDb(): Promise<Db> {
  g.__db ??= openDb()
  return g.__db
}
