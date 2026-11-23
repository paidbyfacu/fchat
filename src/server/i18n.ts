import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { lang } from "next/root-params"
import { getMessages, type Messages } from "@/lib/i18n"
import { isLocale, LOCALE_COOKIE, pickLocale, type Locale } from "@/lib/i18n/locale"

/**
 * Language of the page being rendered, from the /[lang] segment the proxy adds.
 * For Server Components, layouts and generateMetadata.
 */
export async function pageLocale(): Promise<Locale> {
  const l = await lang()
  return isLocale(l) ? l : "en"
}

/** Texts of the page being rendered. */
export async function getT() {
  const locale = await pageLocale()
  return { locale, t: getMessages(locale) }
}

/**
 * Language of the request, for Server Actions and Route Handlers, which cannot read
 * the /[lang] segment: the same rule the proxy uses, cookie first and then the browser.
 */
export async function requestLocale(): Promise<Locale> {
  const [c, h] = await Promise.all([cookies(), headers()])
  return pickLocale(c.get(LOCALE_COOKIE)?.value, h.get("accept-language"))
}

/** Texts for a Server Action or Route Handler. */
export async function getActionT() {
  const locale = await requestLocale()
  return { locale, t: getMessages(locale) }
}

/** generateMetadata that only sets the tab title: export const generateMetadata = pageTitle((t) => t.settings.title) */
export function pageTitle(pick: (t: Messages) => string) {
  return async function generateMetadata(): Promise<Metadata> {
    return { title: pick((await getT()).t) }
  }
}
