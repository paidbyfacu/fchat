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

/**
 * Neon entrega la dirección con sslmode=require. node-postgres ya la trata como
 * verify-full, pero lo avisa con un «SECURITY WARNING» en cada arranque, que en los
 * Logs de Vercel sale en rojo como si fuera un error. Pedir verify-full es lo mismo
 * que hace hoy y no deja ese aviso.
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
    // no es una URL: se usa tal cual
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

// Candado de las migraciones. En la primera visita a una instalación nueva de Vercel
// arrancan varias funciones a la vez y todas quieren migrar la base vacía: sin esto,
// la segunda repetía la migración que la primera ya había aplicado, fallaba con
// «column ... already exists» y la página daba «Internal Server Error». Con el candado,
// la segunda espera a la primera y después saltea lo que ya quedó aplicado.
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
      // otra función pudo aplicarla mientras esta esperaba el candado
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
// Si abrirla falla, como una base de Neon que tarda en despertar o dos funciones que
// migran a la vez en la primera instalación, no se guarda el error: el próximo pedido
// lo vuelve a intentar en vez de fallar hasta que Vercel recicle la función.
const g = globalThis as unknown as { __db?: Promise<Db> }
export function getDb(): Promise<Db> {
  g.__db ??= openDb().catch((e) => {
    g.__db = undefined
    throw e
  })
  return g.__db
}
