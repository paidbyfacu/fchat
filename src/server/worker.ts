// El worker. En la PC o en un servidor propio vive dentro del proceso de Next
// (lo arranca instrumentation.ts) y corre un ciclo cada 2 segundos.
// En Vercel no hay proceso fijo: el webhook corre el ciclo justo después de
// responder, con after(), y /api/cron lo corre de vez en cuando para los
// reintentos, los runs colgados y la renovación de tokens.

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
      log("token renovado", a.username)
    } catch (e) {
      log("no se pudo renovar el token", { account: a.username, error: String(e) })
    }
  }
}

/** Usuario dueño, cuenta desde IG_ACCESS_TOKEN y automatización de ejemplo. Una vez por proceso. */
export function bootstrap(): Promise<void> {
  g.__boot ??= (async () => {
    const d = await deps()
    await ensureOwner(d.db)
    await importAccountFromEnv(d.db, d.ig).catch((e) => log("importar la cuenta falló", String(e)))
    await seedDefaultAutomation(d.db)
  })().catch((e) => {
    g.__boot = undefined // que el próximo intento lo vuelva a probar
    throw e
  })
  return g.__boot
}

/** Un ciclo completo. Las tareas lentas solo si se piden. */
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
    log("ciclo falló", String(e))
  } finally {
    s.busy = false
  }
}

export function kick() {
  void tick()
}

/** En Vercel cada función vive poco: sin intervalo, solo el arranque. */
export const isServerless = () => !!process.env.VERCEL

export async function startWorker() {
  await bootstrap()
  if (isServerless() || g.__worker?.started) return
  g.__worker = { started: true, busy: false, lastExpire: 0, lastRefresh: Date.now() }
  setInterval(tick, 2000).unref()
  log("listo")
}
