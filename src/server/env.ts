// Configuración. En producción falta algo → error al arrancar, no a mitad de un envío.

const isProd = process.env.NODE_ENV === "production"

function need(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Falta la variable de entorno ${name}`)
  return v
}

export const env = {
  isProd,
  /** URL pública del panel. En Vercel, si no se define, sale sola del dominio de producción. */
  publicUrl: () => {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
    const url = process.env.PUBLIC_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")
    return url.replace(/\/$/, "")
  },
  sessionSecret: () => need("SESSION_SECRET"),
  tokenEncKey: () => need("TOKEN_ENC_KEY"),
  igAppId: () => need("IG_APP_ID"),
  igAppSecret: () => need("IG_APP_SECRET"),
  webhookVerifyToken: () => need("WEBHOOK_VERIFY_TOKEN"),
  apiVersion: () => process.env.IG_API_VERSION ?? "v26.0",
  ownerEmail: () => process.env.OWNER_EMAIL,
  ownerPassword: () => process.env.OWNER_PASSWORD,
  /** Secreto de /api/cron. Vercel lo manda solo si la variable se llama CRON_SECRET. */
  cronSecret: () => process.env.CRON_SECRET,
  /** Token de Instagram pegado a mano, sin pasar por OAuth. */
  igAccessToken: () => process.env.IG_ACCESS_TOKEN?.trim() || undefined,
}
