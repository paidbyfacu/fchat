// Arranque: usuario dueño desde el entorno, la cuenta de IG_ACCESS_TOKEN si está
// y una automatización de ejemplo en borrador.

import { createHash } from "node:crypto"
import type { Db } from "./db"
import { decrypt, encrypt, hashPassword, verifyPassword } from "./crypto"
import { env } from "./env"
import type { InstagramClient } from "./instagram"
import { commentToDmGraph } from "./engine/graph"

/** Largo mínimo de OWNER_PASSWORD en producción: el panel queda en internet. */
export const MIN_OWNER_PASSWORD = 12

export async function ensureOwner(db: Db) {
  const email = env.ownerEmail()
  const password = env.ownerPassword()
  if (!email || !password) {
    console.error("[bootstrap] faltan OWNER_EMAIL u OWNER_PASSWORD: nadie va a poder entrar al panel")
    return
  }
  if (env.isProd && password.length < MIN_OWNER_PASSWORD) {
    console.error(`[bootstrap] OWNER_PASSWORD tiene que tener al menos ${MIN_OWNER_PASSWORD} caracteres: no se aplicó`)
    return
  }
  const [u] = await db.query<{ id: string; password_hash: string }>(`select id, password_hash from users where email = $1`, [email])
  if (!u) {
    await db.query(`insert into users (email, password_hash) values ($1, $2)`, [email, await hashPassword(password)])
    return
  }
  // OWNER_PASSWORD manda: si cambió en el entorno, se actualiza al arrancar
  if (!(await verifyPassword(password, u.password_hash))) {
    await db.query(`update users set password_hash = $2 where id = $1`, [u.id, await hashPassword(password)])
    // contraseña nueva: se cierran todas las sesiones abiertas, por si alguien entró con la vieja
    await db.query(`update sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [u.id])
  }
}

/**
 * Token de Instagram sin pasar por OAuth: IG_ACCESS_TOKEN del entorno. Se importa
 * solo cuando cambia: se guarda una huella del último importado, así un arranque
 * nuevo no pisa el token que la app ya renovó.
 */
export async function importAccountFromEnv(db: Db, ig: InstagramClient) {
  const token = env.igAccessToken()
  if (!token) return
  const [owner] = await db.query<{ id: string }>(`select id from users order by created_at limit 1`)
  if (!owner) return
  const fingerprint = createHash("sha256").update(token).digest("hex")
  const [seen] = await db.query<{ value: string }>(`select value from app_settings where key = 'imported_token'`)
  const [existing] = await db.query<{ id: string; access_token_enc: Uint8Array; status: string }>(
    `select id, access_token_enc, status from ig_accounts order by created_at limit 1`,
  )
  const key = env.tokenEncKey()
  // ya importado, o es el mismo de la cuenta activa: nada que hacer, sin gastar una llamada a Meta
  if (existing && (seen?.value === fingerprint || (existing.status === "ok" && decrypt(existing.access_token_enc, key) === token))) return
  const me = await ig.getMe(token)
  await ig
    .subscribe(token, me.user_id, ["comments", "messages", "messaging_postbacks"])
    .catch((e) => console.log("[bootstrap] no se pudo suscribir a los webhooks", String(e)))
  const remember = () =>
    db.query(
      `insert into app_settings (key, value) values ('imported_token', $1)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [fingerprint],
    )
  // el token del panel de Meta dura 60 días; sin la fecha exacta, se asume 55
  const [updated] = await db.query(
    `update ig_accounts set access_token_enc = $2, username = $3, profile_pic_url = coalesce($4, profile_pic_url),
       token_expires_at = now() + interval '55 days', status = 'ok', webhooks_subscribed = true
     where ig_user_id = $1 returning id`,
    [me.user_id, encrypt(token, key), me.username, me.profile_picture_url ?? null],
  )
  if (updated) {
    await remember()
    console.log("[bootstrap] token nuevo cargado para", me.username)
    return
  }
  if (existing) return // el token es de otra cuenta: se conecta desde el panel
  await db.query(
    `insert into ig_accounts (user_id, ig_user_id, username, profile_pic_url, access_token_enc, token_expires_at, webhooks_subscribed)
     values ($1, $2, $3, $4, $5, now() + interval '55 days', true)`,
    [owner.id, me.user_id, me.username, me.profile_picture_url ?? null, encrypt(token, key)],
  )
  await remember()
}

/** La automatización del núcleo, en borrador, para la primera cuenta sin automatizaciones. */
export async function seedDefaultAutomation(db: Db) {
  const [acc] = await db.query<{ id: string; username: string }>(
    `select a.id, a.username from ig_accounts a
     where not exists (select 1 from automations x where x.ig_account_id = a.id)
     order by a.created_at limit 1`,
  )
  if (!acc) return
  const graph = commentToDmGraph({
    opening: "¡Hola! Vi tu comentario 🙌 ¿Te mando el link por aquí?",
    openingButton: "Sí, mándamelo",
    followPrompt: "Una cosita antes: el link es para quienes me siguen. Sígueme y toca «Ya te sigo» 💛",
    followedButton: "Ya te sigo",
    linkText: "¡Listo! Aquí lo tienes 👇",
    links: [{ title: "Abrir link", url: "https://example.com" }],
  })
  await db.tx(async (q) => {
    const [a] = await q.query<{ id: string }>(
      `insert into automations (ig_account_id, name, kind, template, status) values ($1, $2, 'quick', 'comment_dm', 'draft') returning id`,
      [acc.id, "Comentario LINK → DM con link"],
    )
    const [v] = await q.query<{ id: string }>(
      `insert into automation_versions (automation_id, version, graph) values ($1, 1, $2) returning id`,
      [a.id, JSON.stringify(graph)],
    )
    await q.query(`update automations set live_version_id = $2 where id = $1`, [a.id, v.id])
    await q.query(
      `insert into triggers (automation_id, ig_account_id, type, post_scope, keywords_include, match, is_active)
       values ($1, $2, 'comment', 'any', $3, 'contains', false)`,
      [a.id, acc.id, ["link"]],
    )
  })
}
