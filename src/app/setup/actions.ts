"use server"

import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { hashPassword } from "@/server/crypto"
import { MIN_OWNER_PASSWORD } from "@/server/bootstrap"
import { createSession, SESSION_COOKIE, sessionUser } from "@/server/session"
import { bootstrap } from "@/server/worker"
import { validTimezone } from "@/server/setup"
import { TERMS_VERSION } from "@/lib/terms"
import { cookies } from "next/headers"

export type SetupState = {
  error?: string
  field?: "name" | "email" | "password" | "confirm" | "terms"
  values?: { name: string; email: string }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Crea la cuenta de administrador. Solo funciona mientras no haya ningún usuario. */
export async function createAdmin(_prev: SetupState, form: FormData): Promise<SetupState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 80)
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200)
  const password = String(form.get("password") ?? "").slice(0, 200)
  const confirm = String(form.get("confirm") ?? "").slice(0, 200)
  const timezone = validTimezone(String(form.get("timezone") ?? "")) ?? "America/Argentina/Buenos_Aires"
  const values = { name, email }

  if (!name) return { error: "Escribe tu nombre.", field: "name", values }
  if (!EMAIL.test(email)) return { error: "Escribe un email válido.", field: "email", values }
  if (password.length < MIN_OWNER_PASSWORD)
    return { error: `La contraseña necesita ${MIN_OWNER_PASSWORD} caracteres o más.`, field: "password", values }
  if (password !== confirm) return { error: "Las contraseñas no coinciden.", field: "confirm", values }
  if (form.get("terms") !== "on") return { error: "Para seguir tienes que aceptar los términos.", field: "terms", values }

  await bootstrap().catch(() => {})
  const hash = await hashPassword(password)
  const db = await getDb()
  const userId = await db.tx(async (q) => {
    const [{ n }] = await q.query<{ n: number }>(`select count(*)::int as n from users`)
    if (n > 0) return null
    // reserva la instalación: si dos personas envían el formulario a la vez, gana una sola
    const claimed = await q.query(
      `insert into app_settings (key, value) values ('setup_done', now()::text) on conflict (key) do nothing returning key`,
    )
    if (!claimed.length) return null
    const [u] = await q.query<{ id: string }>(
      `insert into users (email, password_hash, name, timezone, terms_accepted_at, terms_version)
       values ($1, $2, $3, $4, now(), $5) returning id`,
      [email, hash, name, timezone, TERMS_VERSION],
    )
    return u.id
  })
  if (!userId) redirect("/login")
  await createSession(userId)
  redirect("/conectar?bienvenida=1")
}

/** Acepta los términos vigentes desde /setup/terminos. */
export async function acceptTerms(): Promise<void> {
  const user = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  if (!user) redirect("/login")
  await (await getDb()).query(`update users set terms_accepted_at = now(), terms_version = $2 where id = $1`, [user.id, TERMS_VERSION])
  redirect("/")
}
