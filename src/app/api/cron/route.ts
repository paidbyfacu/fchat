import { NextResponse, type NextRequest } from "next/server"
import { safeEqual } from "@/server/crypto"
import { env } from "@/server/env"
import { bootstrap, runCycle } from "@/server/worker"

// Lo llama el cron de Vercel, o un cron externo con el mismo secreto:
// reintentos pendientes, runs colgados y tokens por vencer.
export async function GET(req: NextRequest) {
  const secret = env.cronSecret()
  if (!secret || !safeEqual(req.headers.get("authorization"), `Bearer ${secret}`)) {
    return new NextResponse("forbidden", { status: 403 })
  }
  await bootstrap()
  const r = await runCycle({ expire: true, refresh: true })
  return NextResponse.json({ ok: true, ...r })
}
