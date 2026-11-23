"use server"

import { getDb } from "@/server/db"
import { hashPassword, verifyPassword } from "@/server/crypto"
import { MIN_OWNER_PASSWORD, passwordFromEnv } from "@/server/bootstrap"
import { requireUser, revokeSessions } from "@/server/session"
import { getActionT } from "@/server/i18n"
import { fmt } from "@/lib/i18n/locale"

export type PasswordState = { ok?: boolean; error?: string; field?: "current" | "password" | "confirm" }

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requireUser()
  const t = (await getActionT()).t.settings
  if (passwordFromEnv(user.email)) {
    return { error: t.errPasswordFromEnv }
  }
  const current = String(form.get("current") ?? "").slice(0, 200)
  const password = String(form.get("password") ?? "").slice(0, 200)
  const confirm = String(form.get("confirm") ?? "").slice(0, 200)
  const db = await getDb()
  const [u] = await db.query<{ password_hash: string }>(`select password_hash from users where id = $1`, [user.id])
  if (!u || !(await verifyPassword(current, u.password_hash))) return { error: t.errCurrentWrong, field: "current" }
  if (password.length < MIN_OWNER_PASSWORD) {
    return { error: fmt(t.errPasswordShort, { n: MIN_OWNER_PASSWORD }), field: "password" }
  }
  if (password === current) return { error: t.errPasswordSame, field: "password" }
  if (password !== confirm) return { error: t.errPasswordMismatch, field: "confirm" }
  await db.query(`update users set password_hash = $2 where id = $1`, [user.id, await hashPassword(password)])
  // in case someone got in with the old one: close the other sessions
  await revokeSessions(user.id, user.sessionId)
  return { ok: true }
}
