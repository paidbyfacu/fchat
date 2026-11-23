import { connection, NextResponse, type NextRequest } from "next/server"
import { sign } from "@/server/crypto"
import { env } from "@/server/env"
import { igApp, secrets } from "@/server/config"

const SCOPES = ["instagram_business_basic", "instagram_business_manage_messages", "instagram_business_manage_comments"]

// Starts the Instagram Business Login. The signed state keeps another site from
// completing the connection on your behalf.
export async function GET(req: NextRequest) {
  await connection() // always at request time, never at build
  const app = await igApp().catch(() => null)
  if (!app) return NextResponse.redirect(new URL("/conectar?error=config", req.url))
  const appId = app.appId
  const secret = await secrets.session()
  const state = sign({ exp: Date.now() + 10 * 60_000, n: crypto.randomUUID() }, secret)
  const url = new URL("https://www.instagram.com/oauth/authorize")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", `${env.publicUrl()}/api/instagram/callback`)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", SCOPES.join(","))
  url.searchParams.set("state", state)
  const res = NextResponse.redirect(url)
  res.cookies.set("ig_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: env.isProd, maxAge: 600, path: "/" })
  return res
}
