// The worker. On a computer or your own server it lives inside the Next process,
// started by instrumentation.ts, and runs a cycle every 2 seconds.
// On Vercel there is no long-running process: the webhook runs the cycle right after
// responding, with after(), and /api/cron runs it now and then for retries, stuck
// runs and token renewal.

import { getDb } from "./db"
import { decrypt, encrypt } from "./crypto"
import { env } from "./env"
import { secrets } from "./config"
import { httpInstagram } from "./instagram"
import { importAccountFromEnv, ensureOwner, seedDefaultAutomation } from "./bootstrap"
import { expireStaleRuns, processPending, resumeDueRuns } from "./engine/engine"

type WorkerState = { started: boolean; busy: boolean; lastExpire: number; lastRefresh: number }
const g = globalThis as unknown as { __worker?: WorkerState; __boot?: Promise<void> }

const log = (msg: string, data?: unknown) => console.log(`[worker] ${msg}`, data ?? "")

async function deps() {
  return { db: await getDb(), ig: httpInstagram(env.apiVersion()), encKey: await secrets.tokenEncKey(), log }
}

async function refreshTokens() {
  const d = await deps()
  const due = await d.db.query<{ id: string; username: string; access_token_enc: Uint8Array }>(
    `select id, username, access_token_enc from ig_accounts
     where status = 'ok' and token_expires_at < now() + interval '15 days'`,
  )
  for (const a of due) {
    try {
      const r = await d.ig.refreshToken(decrypt(a.access_token_enc, d.encKey))
      await d.db.query(
        `update ig_accounts set access_token_enc = $2, token_expires_at = now() + make_interval(secs => $3) where id = $1`,
        [a.id, encrypt(r.access_token, d.encKey), r.expires_in],
      )
      log("token renewed", a.username)
    } catch (e) {
      log("could not renew the token", { account: a.username, error: String(e) })
    }
  }
}

/** Owner user, account from IG_ACCESS_TOKEN and sample automation. Once per process. */
export function bootstrap(): Promise<void> {
  g.__boot ??= (async () => {
    const d = await deps()
    await ensureOwner(d.db)
    await importAccountFromEnv(d.db, d.ig).catch((e) => log("account import failed", String(e)))
    await seedDefaultAutomation(d.db)
  })().catch((e) => {
    g.__boot = undefined // so the next attempt tries again
    throw e
  })
  return g.__boot
}

/** A full cycle. Slow tasks only when asked for. */
export async function runCycle(opts: { expire?: boolean; refresh?: boolean } = {}) {
  const d = await deps()
  const processed = await processPending(d)
  await resumeDueRuns(d)
  const expired = opts.expire ? await expireStaleRuns(d.db) : 0
  if (opts.refresh) await refreshTokens()
  return { processed, expired }
}

export async function tick() {
  const s = (g.__worker ??= { started: false, busy: false, lastExpire: 0, lastRefresh: Date.now() })
  if (s.busy) return
  s.busy = true
  try {
    const now = Date.now()
    const expire = now - s.lastExpire > 10 * 60_000
    const refresh = now - s.lastRefresh > 60 * 60_000
    if (expire) s.lastExpire = now
    if (refresh) s.lastRefresh = now
    await runCycle({ expire, refresh })
  } catch (e) {
    log("cycle failed", String(e))
  } finally {
    s.busy = false
  }
}

export function kick() {
  void tick()
}

/** On Vercel each function lives briefly: no interval, only startup. */
export const isServerless = () => !!process.env.VERCEL

export async function startWorker() {
  await bootstrap()
  if (isServerless() || g.__worker?.started) return
  g.__worker = { started: true, busy: false, lastExpire: 0, lastRefresh: Date.now() }
  setInterval(tick, 2000).unref()
  log("ready")
}
