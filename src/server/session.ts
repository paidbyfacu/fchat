// Sesión: cookie httpOnly firmada con secrets.session, ver crypto.sign, que apunta a
// una fila de la tabla sessions. La firma sola no alcanza: la sesión tiene que seguir
// activa en la base, así salir o cerrarla desde Ajustes la anula de verdad.

import { cache } from "react"
import { cookies, headers } from "next/headers"
import { connection } from "next/server"
import { redirect } from "next/navigation"
import { getDb } from "./db"
import { sign, verify } from "./crypto"
import { env } from "./env"
import { secrets } from "./config"
import { TERMS_VERSION } from "@/lib/terms"

export const SESSION_COOKIE = "sid"
const MAX_AGE_S = 30 * 86400

/** typ separa la cookie de sesión de otros tokens firmados con el mismo secreto, como el state de OAuth. */
export type SessionData = { typ: "s"; sid: string; uid: string; exp: number }
export type SessionUser = {
  id: string
  email: string
  name: string | null
  timezone: string
  sessionId: string
  /** Si ya aceptó los términos vigentes. Hasta entonces el panel lo manda a /setup/terminos. */
  termsAccepted: boolean
}

/** IP del visitante. En Vercel x-forwarded-for lo pone Vercel y no se puede falsear. */
export function clientIp(h: Headers): string {
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
}

export async function createSession(userId: string) {
  const h = await headers()
  const exp = Date.now() + MAX_AGE_S * 1000
  const db = await getDb()
  const [row] = await db.query<{ id: string }>(
    `insert into sessions (user_id, expires_at, ip, user_agent) values ($1, $2, $3, $4) returning id`,
    [userId, new Date(exp), clientIp(h), h.get("user-agent")?.slice(0, 300) ?? null],
  )
  const token = sign({ typ: "s", sid: row.id, uid: userId, exp } satisfies SessionData, await secrets.session())
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  })
}

export async function readSessionToken(token: string | undefined): Promise<SessionData | null> {
  if (!token) return null
  const s = verify<SessionData>(token, await secrets.session())
  return s && s.typ === "s" && typeof s.sid === "string" && typeof s.uid === "string" ? s : null
}

/**
 * Usuario de la cookie, si la sesión sigue activa en la base. Una vez por request:
 * el layout y la página la piden varias veces.
 */
export const sessionUser = cache(async (token: string | undefined): Promise<SessionUser | null> => {
  const s = await readSessionToken(token)
  if (!s) return null
  const db = await getDb()
  const [u] = await db.query<{ id: string; email: string; name: string | null; timezone: string; terms_version: string | null; stale: boolean }>(
    `select u.id, u.email, u.name, u.timezone, u.terms_version, s.last_seen_at < now() - interval '5 minutes' as stale
     from sessions s join users u on u.id = s.user_id
     where s.id = $1 and s.user_id = $2 and s.revoked_at is null and s.expires_at > now()`,
    [s.sid, s.uid],
  )
  if (!u) return null
  if (u.stale) await db.query(`update sessions set last_seen_at = now() where id = $1`, [s.sid])
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    timezone: u.timezone,
    sessionId: s.sid,
    termsAccepted: u.terms_version === TERMS_VERSION,
  }
})

export async function destroySession() {
  const jar = await cookies()
  const s = await readSessionToken(jar.get(SESSION_COOKIE)?.value)
  if (s) await (await getDb()).query(`update sessions set revoked_at = now() where id = $1 and revoked_at is null`, [s.sid])
  jar.delete(SESSION_COOKIE)
}

export async function requireUser(): Promise<SessionUser> {
  // verify() compara la expiración con la hora actual: con Cache Components eso
  // tiene que pasar en el request, no al prerenderizar
  await connection()
  const u = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  if (!u) redirect("/login")
  if (!u.termsAccepted) redirect("/setup/terminos")
  return u
}

/** Cierra todas las sesiones del usuario, menos la indicada si se pasa. */
export async function revokeSessions(userId: string, except?: string) {
  await (await getDb()).query(
    `update sessions set revoked_at = now()
     where user_id = $1 and revoked_at is null and ($2::uuid is null or id <> $2::uuid)`,
    [userId, except ?? null],
  )
}
