// Freno contra quien prueba contraseñas. Vive en la base, no en memoria: en Vercel
// cada intento puede caer en una función distinta.

import type { Db } from "./db"

/** Intentos por IP en 15 minutos antes de bloquear esa IP. */
export const PER_IP = 5
/** Contraseñas revisadas en una hora, sumando todas las IP, antes de cerrar el login. */
export const GLOBAL_PER_HOUR = 30

export type Attempt = { id: string; blocked: boolean }

/**
 * Anota el intento ANTES de revisar la contraseña, así varios intentos en paralelo
 * se ven entre sí. Los intentos bloqueados también cuentan: insistir alarga el bloqueo.
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
  // solo cuenta para el tope global si la contraseña se va a revisar: una sola IP
  // insistiendo no puede cerrarle el login al dueño
  if (!blocked) await db.query(`update login_attempts set checked = true where id = $1`, [row.id])
  return { id: String(row.id), blocked }
}

/** Entró bien: se borran los intentos de esa IP. */
export async function clearAttempts(db: Db, ip: string) {
  await db.query(`delete from login_attempts where ip = $1`, [ip])
}

/** Limpieza: los intentos de hace más de un día ya no sirven. */
export async function pruneAttempts(db: Db) {
  await db.query(`delete from login_attempts where at < now() - interval '1 day'`)
}
