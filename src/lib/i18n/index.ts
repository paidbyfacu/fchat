import type { Locale } from "./locale"
import { common } from "./messages/common"
import { settings } from "./messages/settings"
import { home } from "./messages/home"
import { automations, wizard } from "./messages/automations"
import { conectar } from "./messages/conectar"
import { contacts } from "./messages/contacts"
import { inbox } from "./messages/inbox"
import { auth } from "./messages/auth"
import { legal } from "./messages/legal"
import { ui } from "./messages/ui"

/**
 * Every dashboard text, by namespace. Each namespace has the same keys in "es" and "en",
 * which defineMessages checks. New texts always go in both languages.
 */
const namespaces = { common, settings, home, automations, wizard, conectar, contacts, inbox, auth, legal, ui }

export type Messages = { [K in keyof typeof namespaces]: (typeof namespaces)[K]["es"] }

const cache = new Map<Locale, Messages>()

/** All texts in one language. Plain strings, so they can be passed to the client provider. */
export function getMessages(locale: Locale): Messages {
  let m = cache.get(locale)
  if (!m) {
    m = Object.fromEntries(Object.entries(namespaces).map(([k, v]) => [k, v[locale]])) as Messages
    cache.set(locale, m)
  }
  return m
}
