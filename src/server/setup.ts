// Installation: while there are no users, the dashboard shows /setup to create the
// admin account. If OWNER_EMAIL and OWNER_PASSWORD are in the environment, startup
// creates that user and the installation screen does not appear.

import { getDb } from "./db"
import { bootstrap } from "./worker"

export async function needsSetup(): Promise<boolean> {
  await bootstrap().catch((e) => console.error("[setup] startup failed", String(e)))
  const [r] = await (await getDb()).query<{ n: number }>(`select count(*)::int as n from users`)
  return r.n === 0
}

/** A time zone Intl accepts, or null. */
export function validTimezone(tz: string): string | null {
  if (!tz || tz.length > 64) return null
  try {
    new Intl.DateTimeFormat("es", { timeZone: tz })
    return tz
  } catch {
    return null
  }
}
