"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { hashPassword, verifyPassword } from "@/server/crypto"
import { clearAttempts, pruneAttempts, startAttempt } from "@/server/login-guard"
import { clientIp, createSession } from "@/server/session"
import { safeNext } from "@/lib/safe-next"
import { getActionT } from "@/server/i18n"

export type LoginState = { error?: string; email?: string }

// Dummy hash: when the email does not exist a password is still checked, so the
// response time does not reveal which emails are registered.
let dummyHash: Promise<string> | undefined

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200)
  const password = String(form.get("password") ?? "").slice(0, 200)
  const next = safeNext(String(form.get("next") ?? "/"))
  const ip = clientIp(await headers())
  const db = await getDb()

  const attempt = await startAttempt(db, ip, email)
  if (attempt.blocked) return { error: (await getActionT()).t.auth.tooManyAttempts, email }

  const [u] = await db.query<{ id: string; password_hash: string }>(`select id, password_hash from users where lower(email) = $1`, [email])
  const ok = u ? await verifyPassword(password, u.password_hash) : await verifyPassword(password, await (dummyHash ??= hashPassword("x")))
  if (!u || !ok) {
    await pruneAttempts(db)
    await new Promise((r) => setTimeout(r, 600)) // slows down repeated attempts
    return { error: (await getActionT()).t.auth.badCredentials, email }
  }
  await clearAttempts(db, ip)
  await createSession(u.id)
  redirect(next)
}
