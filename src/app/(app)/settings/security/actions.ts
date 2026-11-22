"use server"

import { getDb } from "@/server/db"
import { hashPassword, verifyPassword } from "@/server/crypto"
import { MIN_OWNER_PASSWORD, passwordFromEnv } from "@/server/bootstrap"
import { requireUser, revokeSessions } from "@/server/session"

export type PasswordState = { ok?: boolean; error?: string; field?: "current" | "password" | "confirm" }

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const user = await requireUser()
  if (passwordFromEnv(user.email)) {
    return { error: "Tu contraseña sale de la variable OWNER_PASSWORD de tu servidor. Cámbiala allí y vuelve a desplegar." }
  }
  const current = String(form.get("current") ?? "").slice(0, 200)
  const password = String(form.get("password") ?? "").slice(0, 200)
  const confirm = String(form.get("confirm") ?? "").slice(0, 200)
  const db = await getDb()
  const [u] = await db.query<{ password_hash: string }>(`select password_hash from users where id = $1`, [user.id])
  if (!u || !(await verifyPassword(current, u.password_hash))) return { error: "La contraseña actual no es correcta.", field: "current" }
  if (password.length < MIN_OWNER_PASSWORD) {
    return { error: `La contraseña nueva necesita ${MIN_OWNER_PASSWORD} caracteres o más.`, field: "password" }
  }
  if (password === current) return { error: "Elige una contraseña distinta de la actual.", field: "password" }
  if (password !== confirm) return { error: "Las contraseñas no coinciden.", field: "confirm" }
  await db.query(`update users set password_hash = $2 where id = $1`, [user.id, await hashPassword(password)])
  // por si alguien entró con la vieja: se cierran las demás sesiones
  await revokeSessions(user.id, user.sessionId)
  return { ok: true }
}
