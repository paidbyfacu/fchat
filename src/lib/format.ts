import { getMessages } from "@/lib/i18n"
import { fmt, intlLocale, type Locale } from "@/lib/i18n/locale"

const rtfs = new Map<Locale, Intl.RelativeTimeFormat>()
function rtf(locale: Locale) {
  let r = rtfs.get(locale)
  if (!r) rtfs.set(locale, (r = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })))
  return r
}

/** "5 minutes ago", "yesterday", "3 days ago"; past 30 days, the date. */
export function timeAgo(d: Date | string | null | undefined, locale: Locale, now = new Date()): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  const s = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(s)
  if (abs < 60) return getMessages(locale).common.justNow
  if (abs < 3600) return rtf(locale).format(Math.round(s / 60), "minute")
  if (abs < 86400) return rtf(locale).format(Math.round(s / 3600), "hour")
  if (abs < 30 * 86400) return rtf(locale).format(Math.round(s / 86400), "day")
  return date.toLocaleDateString(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" })
}

/** A number with the language's thousands separator. */
export function num(n: number, locale: Locale) {
  return n.toLocaleString(intlLocale(locale))
}

export function daysLeft(d: Date, now = new Date()): number {
  return Math.ceil((d.getTime() - now.getTime()) / 86400_000)
}

const WINDOW_HOURS = 24

/**
 * Hours left in Instagram's 24 h messaging window, or null if it already closed.
 * It lives here and not in a "use client" component because server pages call it.
 */
export function windowLeft(lastInboundAt: Date | null, now = new Date()): number | null {
  if (!lastInboundAt) return null
  const left = WINDOW_HOURS - (now.getTime() - lastInboundAt.getTime()) / 36e5
  return left > 0 ? Math.floor(left) : null
}

/** "1 post", "4 posts", "any post", "the next post". */
export function scopeText(scope: string | null, mediaIds: string[] | null, locale: Locale) {
  const t = getMessages(locale).common
  if (scope === "specific") {
    const n = mediaIds?.length ?? 0
    return n === 1 ? t.scopeOnePost : fmt(t.scopePosts, { n })
  }
  return scope === "next" ? t.scopeNext : t.scopeAny
}
