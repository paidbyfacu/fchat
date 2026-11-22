import { connection, NextResponse } from "next/server"
import { getDb } from "@/server/db"

// Público: solo dice si la app y la base responden, sin números ni detalles de errores.
export async function GET() {
  await connection() // siempre en el request, nunca al construir
  try {
    const db = await getDb()
    await db.query(`select 1`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.log("[health] la base no responde", String(e))
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
