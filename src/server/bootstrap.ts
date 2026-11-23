// Startup: the owner user from the environment if set, the IG_ACCESS_TOKEN account
// if set and a sample draft automation. Without variables, the owner is created
// from the installation screen, at /setup.

import { createHash } from "node:crypto"
import type { Db } from "./db"
import { decrypt, encrypt, hashPassword, verifyPassword } from "./crypto"
import { env } from "./env"
import { secrets } from "./config"
import type { InstagramClient } from "./instagram"
import { commentToDmGraph } from "./engine/graph"
import { defaultWizard } from "@/lib/wizard"

/** Minimum OWNER_PASSWORD length in production: the dashboard is on the internet. */
export const MIN_OWNER_PASSWORD = 12

/** If OWNER_EMAIL and OWNER_PASSWORD are in the environment, that user's password comes from there and is overwritten on every start. */
export function passwordFromEnv(email: string): boolean {
  const e = env.ownerEmail()?.trim().toLowerCase()
  return !!(e && env.ownerPassword() && e === email.toLowerCase())
}

export async function ensureOwner(db: Db) {
  const email = env.ownerEmail()
  const password = env.ownerPassword()
  // no variables: the owner is created from /setup
  if (!email || !password) return
  if (env.isProd && password.length < MIN_OWNER_PASSWORD) {
    console.error(`[bootstrap] OWNER_PASSWORD must have at least ${MIN_OWNER_PASSWORD} characters: not applied`)
    return
  }
  const [u] = await db.query<{ id: string; password_hash: string }>(`select id, password_hash from users where email = $1`, [email])
  if (!u) {
    await db.query(`insert into users (email, password_hash) values ($1, $2)`, [email, await hashPassword(password)])
    return
  }
  // OWNER_PASSWORD wins: if it changed in the environment, it is updated on start
  if (!(await verifyPassword(password, u.password_hash))) {
    await db.query(`update users set password_hash = $2 where id = $1`, [u.id, await hashPassword(password)])
    // new password: every open session is closed, in case someone logged in with the old one
    await db.query(`update sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [u.id])
  }
}

/**
 * Instagram token without OAuth: IG_ACCESS_TOKEN from the environment. It is imported
 * only when it changes: a fingerprint of the last imported one is stored, so a new
 * start does not overwrite the token the app already renewed.
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
  const key = await secrets.tokenEncKey()
  // already imported, or the same as the active account's: nothing to do, without spending a Meta call
  if (existing && (seen?.value === fingerprint || (existing.status === "ok" && decrypt(existing.access_token_enc, key) === token))) return
  const me = await ig.getMe(token)
  await ig
    .subscribe(token, me.user_id, ["comments", "messages", "messaging_postbacks"])
    .catch((e) => console.log("[bootstrap] could not subscribe to webhooks", String(e)))
  const remember = () =>
    db.query(
      `insert into app_settings (key, value) values ('imported_token', $1)
       on conflict (key) do update set value = excluded.value, updated_at = now()`,
      [fingerprint],
    )
  // a token from the Meta dashboard lasts 60 days; without the exact date, 55 is assumed
  const [updated] = await db.query(
    `update ig_accounts set access_token_enc = $2, username = $3, profile_pic_url = coalesce($4, profile_pic_url),
       token_expires_at = now() + interval '55 days', status = 'ok', webhooks_subscribed = true
     where ig_user_id = $1 returning id`,
    [me.user_id, encrypt(token, key), me.username, me.profile_picture_url ?? null],
  )
  if (updated) {
    await remember()
    console.log("[bootstrap] new token loaded for", me.username)
    return
  }
  if (existing) return // the token belongs to another account: it is connected from the dashboard
  await db.query(
    `insert into ig_accounts (user_id, ig_user_id, username, profile_pic_url, access_token_enc, token_expires_at, webhooks_subscribed)
     values ($1, $2, $3, $4, $5, now() + interval '55 days', true)`,
    [owner.id, me.user_id, me.username, me.profile_picture_url ?? null, encrypt(token, key)],
  )
  await remember()
}

/** The core automation, as a draft, for the first account with no automations. */
export async function seedDefaultAutomation(db: Db) {
  const [acc] = await db.query<{ id: string; username: string }>(
    `select a.id, a.username from ig_accounts a
     where not exists (select 1 from automations x where x.ig_account_id = a.id)
     order by a.created_at limit 1`,
  )
  if (!acc) return
  // the same texts a new automation gets in the English wizard
  const w = defaultWizard(acc.id, "en")
  const graph = commentToDmGraph({
    opening: w.opening.text,
    openingButton: w.opening.button,
    followPrompt: w.askFollow.text,
    followedButton: w.askFollow.button,
    linkText: w.link.text,
    links: [{ title: w.link.links[0].title, url: "https://example.com" }],
    profileButton: "Go to profile",
  })
  await db.tx(async (q) => {
    const [a] = await q.query<{ id: string }>(
      `insert into automations (ig_account_id, name, kind, template, status) values ($1, $2, 'quick', 'comment_dm', 'draft') returning id`,
      [acc.id, "LINK comment → DM with link"],
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
