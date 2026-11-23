// Configuration from environment variables. All of them are optional: missing
// secrets are generated automatically and the Instagram app is set up from the
// dashboard, see config.ts.

const isProd = process.env.NODE_ENV === "production"

export const env = {
  isProd,
  /** Public URL of the dashboard. On Vercel, if not set, it comes from the production domain. */
  publicUrl: () => {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
    const url = process.env.PUBLIC_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")
    return url.replace(/\/$/, "")
  },
  apiVersion: () => process.env.IG_API_VERSION ?? "v26.0",
  ownerEmail: () => process.env.OWNER_EMAIL,
  ownerPassword: () => process.env.OWNER_PASSWORD,
  /** Secret for /api/cron. Vercel sends it automatically if the variable is named CRON_SECRET. */
  cronSecret: () => process.env.CRON_SECRET,
  /** Instagram token pasted by hand, without OAuth. */
  igAccessToken: () => process.env.IG_ACCESS_TOKEN?.trim() || undefined,
}
