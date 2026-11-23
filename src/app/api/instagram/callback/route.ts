import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/server/db"
import { encrypt, verify } from "@/server/crypto"
import { env } from "@/server/env"
import { igApp, secrets } from "@/server/config"
import { httpInstagram } from "@/server/instagram"
import { SESSION_COOKIE, sessionUser } from "@/server/session"
import { seedDefaultAutomation } from "@/server/bootstrap"

// Instagram comes back here with a code: code → short-lived token → 60-day token
// → /me → stored encrypted → the account is subscribed to webhooks.
export async function GET(req: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/conectar?${q}`, req.url))
  const q = req.nextUrl.searchParams
  if (q.get("error")) return back("error=denied")

  const secret = await secrets.session()
  const user = await sessionUser(req.cookies.get(SESSION_COOKIE)?.value)
  if (!user) return NextResponse.redirect(new URL("/login", req.url))
  const session = { uid: user.id }
  const state = q.get("state")
  if (!state || state !== req.cookies.get("ig_oauth_state")?.value || !verify(state, secret)) return back("error=state")

  const app = await igApp()
  if (!app) return back("error=config")
  try {
    const form = new URLSearchParams({
      client_id: app.appId,
      client_secret: app.appSecret,
      grant_type: "authorization_code",
      redirect_uri: `${env.publicUrl()}/api/instagram/callback`,
      code: q.get("code") ?? "",
    })
    const short = (await (await fetch("https://api.instagram.com/oauth/access_token", { method: "POST", body: form })).json()) as {
      access_token?: string
    }
    if (!short.access_token) return back("error=exchange")

    const longUrl = new URL("https://graph.instagram.com/access_token")
    longUrl.searchParams.set("grant_type", "ig_exchange_token")
    longUrl.searchParams.set("client_secret", app.appSecret)
    longUrl.searchParams.set("access_token", short.access_token)
    const long = (await (await fetch(longUrl)).json()) as { access_token?: string; expires_in?: number }
    if (!long.access_token) return back("error=exchange")

    const ig = httpInstagram(env.apiVersion())
    const me = await ig.getMe(long.access_token)
    const db = await getDb()
    await db.query(
      `insert into ig_accounts (user_id, ig_user_id, username, profile_pic_url, access_token_enc, token_expires_at, scopes, status)
       values ($1, $2, $3, $4, $5, now() + make_interval(secs => $6), $7, 'ok')
       on conflict (ig_user_id) do update set
         username = excluded.username, profile_pic_url = excluded.profile_pic_url,
         access_token_enc = excluded.access_token_enc, token_expires_at = excluded.token_expires_at,
         scopes = excluded.scopes, status = 'ok'
       where ig_accounts.user_id = excluded.user_id`,
      [
        session.uid,
        me.user_id,
        me.username,
        me.profile_picture_url ?? null,
        encrypt(long.access_token, await secrets.tokenEncKey()),
        long.expires_in ?? 60 * 86400,
        ["instagram_business_basic", "instagram_business_manage_messages", "instagram_business_manage_comments"],
      ],
    )
    await ig.subscribe(long.access_token, me.user_id, ["comments", "messages", "messaging_postbacks"])
    await db.query(`update ig_accounts set webhooks_subscribed = true where ig_user_id = $1`, [me.user_id])
    await seedDefaultAutomation(db)
    const res = back("connected=1")
    res.cookies.delete("ig_oauth_state")
    return res
  } catch {
    return back("error=exchange")
  }
}
