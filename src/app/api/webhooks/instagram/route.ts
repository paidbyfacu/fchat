import { after, NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/server/db"
import { safeEqual, verifyMetaSignature } from "@/server/crypto"
import { env } from "@/server/env"
import { ingest, toIngestItems } from "@/server/engine/ingest"
import { bootstrap, isServerless, kick, runCycle } from "@/server/worker"

// Verificación de Meta al guardar el webhook en el panel.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const ok = q.get("hub.mode") === "subscribe" && safeEqual(q.get("hub.verify_token")?.trim(), env.webhookVerifyToken())
  const challenge = q.get("hub.challenge")
  if (!ok || !challenge) return new NextResponse("forbidden", { status: 403 })
  return new NextResponse(challenge, { status: 200, headers: { "content-type": "text/plain" } })
}

// Eventos. Se guardan y se responde 200 enseguida; el worker los procesa aparte.
// En Vercel se procesan en la misma función, después de responder.
export async function POST(req: NextRequest) {
  const raw = await req.text() // la firma se calcula sobre el body crudo, antes de parsear
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), env.igAppSecret())) {
    return new NextResponse("bad signature", { status: 403 })
  }
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return new NextResponse("bad json", { status: 400 })
  }
  const inserted = await ingest(await getDb(), toIngestItems(body))
  if (inserted) {
    if (isServerless()) {
      after(async () => {
        await bootstrap()
        await runCycle().catch((e) => console.log("[webhook] ciclo falló", String(e)))
      })
    } else kick()
  }
  return new NextResponse("EVENT_RECEIVED", { status: 200 })
}
