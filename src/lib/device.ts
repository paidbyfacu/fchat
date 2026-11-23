import { getMessages } from "@/lib/i18n"
import { fmt, type Locale } from "@/lib/i18n/locale"

/** "Chrome on Windows", "Safari on iPhone"… from the user agent, for the session list. */
export function deviceLabel(ua: string | null | undefined, locale: Locale): string {
  const t = getMessages(locale).settings
  if (!ua) return t.unknownDevice
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : t.otherOs
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Instagram/.test(ua)
        ? "Instagram"
        : /Firefox\/|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : t.browser
  return fmt(t.deviceOn, { browser, os })
}
