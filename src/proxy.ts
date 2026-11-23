import { NextResponse, type NextRequest } from "next/server"
import { verify } from "@/server/crypto"
import { LOCALE_COOKIE, pickLocale } from "@/lib/i18n/locale"

// The whole dashboard needs a session. Public: login, setup, the terms, Meta webhooks,
// the pages Meta asks for, the health check, tracked links and /design in development.
// /api/cron does not use the cookie: it protects itself.
// Only the cookie is checked here; pages, actions and API routes also check that the
// session is still active in the database, with requireUser or sessionUser.
const PUBLIC = [
  /^\/login$/,
  /^\/setup$/,
  /^\/terminos$/,
  /^\/webhook$/,
  /^\/api\/webhooks\//,
  /^\/api\/health$/,
  /^\/api\/cron$/,
  /^\/privacy$/,
  /^\/data-deletion$/,
  /^\/l\//,
]

// Pages live under /[lang]: the proxy adds the language to the path without changing
// the address in the browser. API routes and the webhook have no language.
function isPage(pathname: string) {
  return !pathname.startsWith("/api/") && pathname !== "/webhook"
}

/** /inbox → /es/inbox, keeping the query. A path that already has a language stays as is. */
function withLocale(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!isPage(pathname) || /^\/(en|es)(\/|$)/.test(pathname)) return NextResponse.next()
  const locale = pickLocale(req.cookies.get(LOCALE_COOKIE)?.value, req.headers.get("accept-language"))
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`
  return NextResponse.rewrite(url)
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some((r) => r.test(pathname))) return withLocale(req)
  if (pathname === "/design" && process.env.NODE_ENV !== "production") return withLocale(req)
  const cookie = req.cookies.get("sid")?.value
  // with SESSION_SECRET the signature is checked here. Without it, the secret lives in the
  // database and requireUser checks the signature: here a token-shaped cookie is enough
  const secret = process.env.SESSION_SECRET
  const ok = secret
    ? verify<{ typ?: string; uid: string; exp: number }>(cookie, secret)?.typ === "s"
    : !!cookie && /^[\w-]+\.[\w-]+$/.test(cookie)
  if (ok) return withLocale(req)
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = new URL("/login", req.url)
  if (pathname !== "/") url.searchParams.set("next", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  // also without a session: Next files, the tab icon and any static image
  // all of /_next/ (files, images and the dev reload websocket) stays out
  matcher: ["/((?!_next/|favicon\\.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
}
