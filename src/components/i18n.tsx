"use client"

import { createContext, use, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { Messages } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/locale"

const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null)

/** Gives Client Components the texts of the page's language. Set once in the root layout. */
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  return <I18nContext value={{ locale, t: messages }}>{children}</I18nContext>
}

/** Texts and language for a Client Component. */
export function useT() {
  const ctx = use(I18nContext)
  if (!ctx) throw new Error("useT needs <I18nProvider>")
  return ctx
}

/**
 * The address without the /en or /es the proxy adds internally. On the server the
 * path includes it and in the browser it does not: this keeps both the same.
 */
export function useLocalPath(): string {
  const path = usePathname() ?? "/"
  return path.replace(/^\/(en|es)(?=\/|$)/, "") || "/"
}
