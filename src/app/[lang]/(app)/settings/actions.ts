"use server"

import { cookies } from "next/headers"
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/locale"
import { requireUser } from "@/server/session"

/** Saves the dashboard language for this browser. "auto" goes back to the browser's language. */
export async function setLanguage(value: string) {
  await requireUser()
  const c = await cookies()
  if (isLocale(value)) {
    c.set(LOCALE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" })
  } else {
    c.delete(LOCALE_COOKIE)
  }
}
