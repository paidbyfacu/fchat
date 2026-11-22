"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { hashPassword, verifyPassword } from "@/server/crypto"
import { clearAttempts, pruneAttempts, startAttempt } from "@/server/login-guard"
import { clientIp, createSession } from "@/server/session"
import { safeNext } from "@/lib/safe-next"

export type LoginState = { error?: string; email?: string }

// Hash de relleno: si el email no existe se revisa igual una contraseña, así el
// tiempo de respuesta no delata qué emails están registrados.
let dummyHash: Promise<string> | undefined

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200)
  const password = String(form.get("password") ?? "").slice(0, 200)
  const next = safeNext(String(form.get("next") ?? "/"))
  const ip = clientIp(await headers())
  const db = await getDb()

  const attempt = await startAttempt(db, ip, email)
  if (attempt.blocked) return { error: "Demasiados intentos. Espera 15 minutos y vuelve a probar.", email }

  const [u] = await db.query<{ id: string; password_hash: string }>(`select id, password_hash from users where lower(email) = $1`, [email])
  const ok = u ? await verifyPassword(password, u.password_hash) : await verifyPassword(password, await (dummyHash ??= hashPassword("x")))
  if (!u || !ok) {
    await pruneAttempts(db)
    await new Promise((r) => setTimeout(r, 600)) // frena intentos seguidos
    return { error: "El email o la contraseña no coinciden.", email }
  }
  await clearAttempts(db, ip)
  await createSession(u.id)
  redirect(next)
}
