import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { migrate, openDb, pgConnectionString } from "./db"

let dir: string | undefined

describe("migraciones", () => {
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it("dos arranques a la vez aplican cada migración una sola vez", async () => {
    // como la primera visita a una instalación nueva de Vercel: varias funciones migran juntas
    const db = await openDb({ pgliteDir: "memory://", url: "" })
    dir = mkdtempSync(path.join(tmpdir(), "fchat-migr-"))
    writeFileSync(path.join(dir, "9001_tabla.sql"), "create table prueba_a (id int primary key);")
    writeFileSync(path.join(dir, "9002_columna.sql"), "alter table prueba_a add column nombre text;")

    const results = await Promise.all([migrate(db, dir), migrate(db, dir), migrate(db, dir)])

    expect(results.flat().sort()).toEqual(["9001_tabla.sql", "9002_columna.sql"])
    const cols = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name = 'prueba_a' order by column_name`,
    )
    expect(cols.map((c) => c.column_name)).toEqual(["id", "nombre"])
    // y volver a migrar no hace nada
    expect(await migrate(db, dir)).toEqual([])
  })
})

describe("dirección de Postgres", () => {
  it("pide verify-full en lugar de require, sin tocar lo demás", () => {
    const neon = "postgresql://usuario:cl%40ve@ep-ejemplo-pooler.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    const out = new URL(pgConnectionString(neon))
    expect(out.searchParams.get("sslmode")).toBe("verify-full")
    expect(out.searchParams.get("channel_binding")).toBe("require")
    expect(out.password).toBe("cl%40ve")
    expect(out.hostname).toBe("ep-ejemplo-pooler.us-east-1.aws.neon.tech")
  })

  it("deja igual lo que no hace falta cambiar", () => {
    for (const url of [
      "postgres://u:p@localhost:5432/db",
      "postgres://u:p@host/db?sslmode=disable",
      "postgres://u:p@host/db?sslmode=verify-full",
      "postgres://u:p@host/db?uselibpqcompat=true&sslmode=require",
    ])
      expect(pgConnectionString(url)).toBe(url)
  })
})
