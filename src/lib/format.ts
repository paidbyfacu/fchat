const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" })

/** "hace 5 minutos", "ayer", "hace 3 días"; más de 30 días → fecha. */
export function timeAgo(d: Date | string | null | undefined, now = new Date()): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  const s = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(s)
  if (abs < 60) return "recién"
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour")
  if (abs < 30 * 86400) return rtf.format(Math.round(s / 86400), "day")
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
}

export function daysLeft(d: Date, now = new Date()): number {
  return Math.ceil((d.getTime() - now.getTime()) / 86400_000)
}

/** «1 post», «4 posts», «cualquier post», «el próximo post». */
export function scopeText(scope: string | null, mediaIds: string[] | null) {
  if (scope === "specific") return (mediaIds?.length ?? 0) === 1 ? "1 post" : `${mediaIds?.length ?? 0} posts`
  return scope === "next" ? "el próximo post" : "cualquier post"
}
