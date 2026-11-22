import { NextResponse, type NextRequest } from "next/server"
import { verify } from "@/server/crypto"

// Todo el panel pide sesión. Lo público: login, webhooks de Meta, páginas que
// pide Meta, health check, links con seguimiento y /design en desarrollo.
// /api/cron no usa la cookie: se protege sola con CRON_SECRET.
// Acá solo se revisa la firma; páginas, acciones y rutas API revisan además que la
// sesión siga activa en la base, con requireUser o sessionUser.
const PUBLIC = [/^\/login$/, /^\/webhook$/, /^\/api\/webhooks\//, /^\/api\/health$/, /^\/api\/cron$/, /^\/privacy$/, /^\/data-deletion$/, /^\/l\//]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next()
  if (pathname === "/design" && process.env.NODE_ENV !== "production") return NextResponse.next()
  const secret = process.env.SESSION_SECRET
  const ok = secret && verify<{ typ?: string; uid: string; exp: number }>(req.cookies.get("sid")?.value, secret)?.typ === "s"
  if (ok) return NextResponse.next()
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  const url = new URL("/login", req.url)
  if (pathname !== "/") url.searchParams.set("next", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  // sin sesión también: archivos de Next, el ícono de la pestaña y cualquier imagen estática
  // todo /_next/ (archivos, imágenes y el websocket de recarga en desarrollo) queda afuera
  matcher: ["/((?!_next/|favicon\\.ico|icon\\.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
}
