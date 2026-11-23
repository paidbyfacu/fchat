// Secrets and Instagram app details. Each one comes first from its environment
// variable and, if missing, from the database. That way a new installation works
// without setting anything in Vercel: secrets are generated the first time and the
// Instagram app is set up from the dashboard, in Connect your accounts.

import { randomBytes } from "node:crypto"
import { getDb } from "./db"
import { decrypt, encrypt } from "./crypto"

const g = globalThis as unknown as { __cfg?: Map<string, Promise<string>> }
const memo = (g.__cfg ??= new Map<string, Promise<string>>())

/** Reads a secret from app_settings or creates it. Two functions at once end up with the same one. */
function generated(key: string, make: () => string): Promise<string> {
  let p = memo.get(key)
  if (!p) {
    p = (async () => {
      const db = await getDb()
      await db.query(`insert into app_settings (key, value) values ($1, $2) on conflict (key) do nothing`, [key, make()])
      const [r] = await db.query<{ value: string }>(`select value from app_settings where key = $1`, [key])
      return r.value
    })().catch((e) => {
      memo.delete(key)
      throw e
    })
    memo.set(key, p)
  }
  return p
}

export const secrets = {
  /** Signs the session cookie and the OAuth state. */
  session: async () => process.env.SESSION_SECRET || generated("secret_session", () => randomBytes(32).toString("base64url")),
  /** Encrypts the Instagram tokens stored in the database: 32 bytes in base64. */
  tokenEncKey: async () => process.env.TOKEN_ENC_KEY || generated("secret_token_key", () => randomBytes(32).toString("base64")),
  /** What goes in the webhook Verify token field in Meta. */
  webhookVerify: async () =>
    process.env.WEBHOOK_VERIFY_TOKEN?.trim() || generated("secret_webhook_verify", () => `fchat-${randomBytes(12).toString("hex")}`),
}

export type IgAppConfig = { appId: string; appSecret: string; source: "env" | "panel" }

/** Instagram app ID and secret, or null if they have not been set yet. */
export async function igApp(): Promise<IgAppConfig | null> {
  const id = process.env.IG_APP_ID?.trim()
  const secret = process.env.IG_APP_SECRET?.trim()
  if (id && secret) return { appId: id, appSecret: secret, source: "env" }
  const db = await getDb()
  const rows = await db.query<{ key: string; value: string }>(
    `select key, value from app_settings where key in ('ig_app_id', 'ig_app_secret_enc')`,
  )
  const get = (k: string) => rows.find((r) => r.key === k)?.value
  const appId = get("ig_app_id")
  const enc = get("ig_app_secret_enc")
  if (!appId || !enc) return null
  return { appId, appSecret: decrypt(Buffer.from(enc, "base64"), await secrets.tokenEncKey()), source: "panel" }
}

export async function saveIgApp(appId: string, appSecret: string) {
  const db = await getDb()
  const enc = encrypt(appSecret, await secrets.tokenEncKey()).toString("base64")
  await db.tx(async (q) => {
    for (const [key, value] of [
      ["ig_app_id", appId],
      ["ig_app_secret_enc", enc],
    ]) {
      await q.query(
        `insert into app_settings (key, value) values ($1, $2)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, value],
      )
    }
  })
}

export async function getSetting(key: string): Promise<{ value: string; updated_at: Date } | null> {
  const [r] = await (await getDb()).query<{ value: string; updated_at: Date }>(`select value, updated_at from app_settings where key = $1`, [key])
  return r ?? null
}

export async function setSetting(key: string, value: string) {
  await (await getDb()).query(
    `insert into app_settings (key, value) values ($1, $2)
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, value],
  )
}
