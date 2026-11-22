import { connection, NextResponse, type NextRequest } from "next/server"
import { safeEqual } from "@/server/crypto"
import { env } from "@/server/env"
import { getDb } from "@/server/db"
import { bootstrap, runCycle } from "@/server/worker"

// Lo llama el cron de Vercel, o un cron externo: reintentos pendientes, runs
// colgados y tokens por vencer. Con CRON_SECRET solo entra quien lo manda. Sin
// él, cualquiera puede llamarlo, pero corre como mucho una vez cada 10 minutos.
export async function GET(req: NextRequest) {
  await connection() // siempre en el request, nunca al construir: sin secreto no lee nada del pedido
  const secret = env.cronSecret()
  if (secret) {
    if (!safeEqual(req.headers.get("authorization"), `Bearer ${secret}`)) return new NextResponse("forbidden", { status: 403 })
  } else if (!(await claimSlot())) {
    return NextResponse.json({ ok: true, skipped: "corrió hace menos de 10 minutos" })
  }
  await bootstrap()
  const r = await runCycle({ expire: true, refresh: true })
  return NextResponse.json({ ok: true, ...r })
}

/** Reserva el turno del cron sin secreto: true si pasaron 10 minutos desde el último. */
async function claimSlot(): Promise<boolean> {
  const rows = await (await getDb()).query(
    `insert into app_settings (key, value) values ('cron_last_open', now()::text)
     on conflict (key) do update set value = excluded.value, updated_at = now()
       where app_settings.updated_at < now() - interval '10 minutes'
     returning key`,
  )
  return rows.length > 0
}
