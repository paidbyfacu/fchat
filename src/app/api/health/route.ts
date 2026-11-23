import { connection, NextResponse } from "next/server"
import { getDb } from "@/server/db"

// Public: only says whether the app and the database respond, with no numbers or error details.
export async function GET() {
  await connection() // always at request time, never at build
  try {
    const db = await getDb()
    await db.query(`select 1`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.log("[health] the database does not respond", String(e))
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
