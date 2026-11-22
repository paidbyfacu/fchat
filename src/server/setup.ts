// Instalación: mientras no hay ningún usuario, el panel muestra /setup para crear
// la cuenta de administrador. Si OWNER_EMAIL y OWNER_PASSWORD están en el entorno,
// el arranque crea ese usuario y la pantalla de instalación no aparece.

import { getDb } from "./db"
import { bootstrap } from "./worker"

export async function needsSetup(): Promise<boolean> {
  await bootstrap().catch((e) => console.error("[setup] el arranque falló", String(e)))
  const [r] = await (await getDb()).query<{ n: number }>(`select count(*)::int as n from users`)
  return r.n === 0
}

/** Zona horaria válida para Intl, o null. */
export function validTimezone(tz: string): string | null {
  if (!tz || tz.length > 64) return null
  try {
    new Intl.DateTimeFormat("es", { timeZone: tz })
    return tz
  } catch {
    return null
  }
}
