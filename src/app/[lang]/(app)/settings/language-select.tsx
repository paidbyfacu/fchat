"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { useT } from "@/components/i18n"
import { LOCALE_COOKIE } from "@/lib/i18n/locale"
import { setLanguage } from "./actions"

const NAMES = { en: "English", es: "Español" } as const

/** Saves the dashboard language in a cookie. "auto" deletes it, so the browser decides again. */
export function LanguageSelect() {
  const { t } = useT()
  const [value, setValue] = useState<string>("auto")
  const [pending, start] = useTransition()

  // the saved choice lives in a cookie: read it after mount so the static page stays the same for everyone
  useEffect(() => {
    const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the cookie only exists in the browser
    if (m && m[1] in NAMES) setValue(m[1])
  }, [])

  return (
    <select
      aria-label={t.settings.language}
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value
        setValue(next)
        start(async () => {
          try {
            await setLanguage(next)
            toast.success(t.settings.languageSaved)
            // a full reload so every page, including cached ones, comes back in the new language
            window.location.reload()
          } catch {
            toast.error(t.settings.languageError)
          }
        })
      }}
      className="h-9 rounded-md border border-input bg-card px-2 text-sm"
    >
      <option value="auto">{t.settings.languageAuto}</option>
      {Object.entries(NAMES).map(([k, name]) => (
        <option key={k} value={k} lang={k}>
          {name}
        </option>
      ))}
    </select>
  )
}
