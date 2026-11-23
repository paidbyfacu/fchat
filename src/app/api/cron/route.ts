import { connection, NextResponse, type NextRequest } from "next/server"
import { safeEqual } from "@/server/crypto"
import { env } from "@/server/env"
import { getDb } from "@/server/db"
import { bootstrap, runCycle } from "@/server/worker"

// Called by the Vercel cron or an external one: pending retries, stuck runs and
// tokens about to expire. With CRON_SECRET only whoever sends it gets in. Without
// it anyone can call it, but it runs at most once every 10 minutes.
export async function GET(req: NextRequest) {
  await connection() // always at request time, never at build: without a secret it reads nothing from the request
  const secret = env.cronSecret()
  if (secret) {
    if (!safeEqual(req.headers.get("authorization"), `Bearer ${secret}`)) return new NextResponse("forbidden", { status: 403 })
  } else if (!(await claimSlot())) {
    return NextResponse.json({ ok: true, skipped: "ran less than 10 minutes ago" })
  }
  await bootstrap()
  const r = await runCycle({ expire: true, refresh: true })
  return NextResponse.json({ ok: true, ...r })
}

/** Claims the turn of the secretless cron: true if 10 minutes have passed since the last one. */
async function claimSlot(): Promise<boolean> {
  const rows = await (await getDb()).query(
    `insert into app_settings (key, value) values ('cron_last_open', now()::text)
     on conflict (key) do update set value = excluded.value, updated_at = now()
       where app_settings.updated_at < now() - interval '10 minutes'
     returning key`,
  )
  return rows.length > 0
}
