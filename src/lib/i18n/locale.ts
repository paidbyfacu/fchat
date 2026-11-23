// Languages the dashboard speaks. The proxy picks one for every request, from the
// language cookie saved in Settings or, without it, from the browser's Accept-Language,
// and serves the page under /en or /es without changing the address.

export const LOCALES = ["en", "es"] as const
export type Locale = (typeof LOCALES)[number]

/** Used when the browser asks for a language FChat does not have. */
export const DEFAULT_LOCALE: Locale = "en"

/** Cookie with the language chosen in Settings. Without it, the browser decides. */
export const LOCALE_COOKIE = "fchat_lang"

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v)
}

/** The best language for an Accept-Language header, such as "es-AR,es;q=0.9,en;q=0.8". */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";")
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
      return { lang: tag.trim().toLowerCase().split("-")[0], q: q ? Number.parseFloat(q.slice(2)) || 0 : 1, i }
    })
    .filter((r) => r.lang && r.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i)
  return ranked.map((r) => r.lang).find(isLocale) ?? DEFAULT_LOCALE
}

/** The language for a request: the saved choice first, then the browser. */
export function pickLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  return isLocale(cookie) ? cookie : localeFromAcceptLanguage(acceptLanguage)
}

/** Fills {name} placeholders: fmt("Hi {name}", { name: "Ana" }). */
export function fmt(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
}

/** Picks the singular or plural text for n and fills {n}: plural(3, "1 post", "{n} posts"). */
export function plural(n: number, one: string, other: string, vars: Record<string, string | number> = {}): string {
  return fmt(n === 1 ? one : other, { n, ...vars })
}

/** Wraps a quoted word the way each language writes it: «link» in Spanish, “link” in English. */
export function quote(locale: Locale, text: string): string {
  return locale === "es" ? `«${text}»` : `“${text}”`
}

/** BCP 47 tag for Intl dates and numbers. */
export function intlLocale(locale: Locale): string {
  return locale === "es" ? "es-AR" : "en-US"
}
