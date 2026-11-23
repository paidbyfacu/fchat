import { NextResponse, type NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getDb } from "@/server/db"
import { decrypt } from "@/server/crypto"
import { env } from "@/server/env"
import { secrets } from "@/server/config"
import { httpInstagram, IgError } from "@/server/instagram"
import { SESSION_COOKIE, sessionUser } from "@/server/session"
import { getActionT } from "@/server/i18n"

// An account's posts for the picker (S06). Short in-memory cache: opening and
// closing the picker does not ask Instagram for everything again.
const cache = new Map<string, { at: number; body: unknown }>()
const TTL = 5 * 60_000

export async function GET(req: NextRequest) {
  const user = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  const { t } = await getActionT()
  if (!user) return NextResponse.json({ error: t.ui.unauthorized }, { status: 401 })
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
  if (!acc) return NextResponse.json({ error: t.ui.accountGone }, { status: 404 })
  try {
    const ig = httpInstagram(env.apiVersion())
    const r = await ig.listMedia(decrypt(acc.access_token_enc, await secrets.tokenEncKey()), acc.ig_user_id, after)
    const body = {
      items: r.data
        .filter((m) => m.media_product_type !== "STORY" && m.media_product_type !== "AD")
        .map((m) => ({
          id: m.id,
          caption: m.caption?.slice(0, 140) ?? "",
          thumbnail: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
          kind: m.media_product_type === "REELS" ? "reel" : m.media_type === "CAROUSEL_ALBUM" ? "carousel" : "post",
          timestamp: m.timestamp,
          permalink: m.permalink,
        })),
      after: r.after,
    }
    cache.set(key, { at: Date.now(), body })
    return NextResponse.json(body)
  } catch (e) {
    const msg = e instanceof IgError ? e.message : t.ui.igNoResponse
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
