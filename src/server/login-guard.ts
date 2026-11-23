// Brake against password guessing. It lives in the database, not in memory: on Vercel
// each attempt may land in a different function.

import type { Db } from "./db"

/** Attempts per IP in 15 minutes before that IP is blocked. */
export const PER_IP = 5
/** Passwords checked in one hour, across all IPs, before the login is closed. */
export const GLOBAL_PER_HOUR = 30

export type Attempt = { id: string; blocked: boolean }

/**
 * Records the attempt BEFORE checking the password, so parallel attempts see each
 * other. Blocked attempts count too: insisting makes the block longer.
 */
export async function startAttempt(db: Db, ip: string, email: string): Promise<Attempt> {
  const [row] = await db.query<{ id: string }>(`insert into login_attempts (ip, email) values ($1, $2) returning id`, [ip, email])
  const [c] = await db.query<{ by_ip: number; total: number }>(
    `select
       count(*) filter (where ip = $1 and at > now() - interval '15 minutes')::int by_ip,
       count(*) filter (where checked)::int total
     from login_attempts where at > now() - interval '1 hour'`,
    [ip],
  )
  const blocked = c.by_ip > PER_IP || c.total >= GLOBAL_PER_HOUR
  // it only counts toward the global limit if the password will be checked: a single
  // insisting IP cannot lock the owner out
  if (!blocked) await db.query(`update login_attempts set checked = true where id = $1`, [row.id])
  return { id: String(row.id), blocked }
}

/** Successful login: that IP's attempts are deleted. */
export async function clearAttempts(db: Db, ip: string) {
  await db.query(`delete from login_attempts where ip = $1`, [ip])
}

/** Cleanup: attempts older than a day are no longer useful. */
export async function pruneAttempts(db: Db) {
  await db.query(`delete from login_attempts where at < now() - interval '1 day'`)
}
