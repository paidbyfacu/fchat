import { after, NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/server/db"
import { safeEqual, verifyMetaSignature } from "@/server/crypto"
import { igApp, secrets, setSetting } from "@/server/config"
import { ingest, toIngestItems } from "@/server/engine/ingest"
import { bootstrap, isServerless, kick, runCycle } from "@/server/worker"

// Meta's verification when the webhook is saved in its dashboard.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams
  const ok = q.get("hub.mode") === "subscribe" && safeEqual(q.get("hub.verify_token")?.trim(), await secrets.webhookVerify())
  const challenge = q.get("hub.challenge")
  if (!ok || !challenge) return new NextResponse("forbidden", { status: 403 })
  // so Connect your accounts marks the webhook step as done
  await setSetting("webhook_verified_at", new Date().toISOString()).catch(() => {})
  return new NextResponse(challenge, { status: 200, headers: { "content-type": "text/plain" } })
}

// Events. They are stored and 200 is returned right away; the worker processes them apart.
// On Vercel they are processed in the same function, after responding.
export async function POST(req: NextRequest) {
  const raw = await req.text() // the signature is computed over the raw body, before parsing
  const app = await igApp()
  if (!app || !verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), app.appSecret)) {
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
        await runCycle().catch((e) => console.log("[webhook] cycle failed", String(e)))
      })
    } else kick()
  }
  return new NextResponse("EVENT_RECEIVED", { status: 200 })
}
