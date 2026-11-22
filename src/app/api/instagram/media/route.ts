import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getDb } from "@/server/db"
import { decrypt } from "@/server/crypto"
import { env } from "@/server/env"
import { httpInstagram, IgError } from "@/server/instagram"
import { SESSION_COOKIE, sessionUser } from "@/server/session"

// Posts de una cuenta para el selector (S06). Caché corto en memoria: abrir y
// cerrar el selector no vuelve a pedirle todo a Instagram.
const cache = new Map<string, { at: number; body: unknown }>()
const TTL = 5 * 60_000

export async function GET(req: NextRequest) {
  const user = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  if (!user) return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  const s = { uid: user.id }
  const accountId = req.nextUrl.searchParams.get("account") ?? ""
  const after = req.nextUrl.searchParams.get("after") ?? undefined
  const key = `${s.uid}:${accountId}:${after ?? ""}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json(hit.body)

  const db = await getDb()
  const [acc] = await db.query<{ ig_user_id: string; access_token_enc: Uint8Array }>(
    `select ig_user_id, access_token_enc from ig_accounts where id = $1 and user_id = $2 and status = 'ok'`,
    [accountId, s.uid],
  )
  if (!acc) return NextResponse.json({ error: "Cuenta no encontrada o desconectada" }, { status: 404 })
  try {
    const ig = httpInstagram(env.apiVersion())
    const r = await ig.listMedia(decrypt(acc.access_token_enc, env.tokenEncKey()), acc.ig_user_id, after)
    const body = {
      items: r.data
        .filter((m) => m.media_product_type !== "STORY" && m.media_product_type !== "AD")
        .map((m) => ({
          id: m.id,
          caption: m.caption?.slice(0, 140) ?? "",
          thumbnail: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
          kind: m.media_product_type === "REELS" ? "reel" : m.media_type === "CAROUSEL_ALBUM" ? "carrusel" : "post",
          timestamp: m.timestamp,
          permalink: m.permalink,
        })),
      after: r.after,
    }
    cache.set(key, { at: Date.now(), body })
    return NextResponse.json(body)
  } catch (e) {
    const msg = e instanceof IgError ? e.message : "Instagram no respondió"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
