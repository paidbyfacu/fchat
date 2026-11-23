import { getMessages } from "@/lib/i18n"
import { fmt, type Locale } from "@/lib/i18n/locale"

// Instagram API limits for the button template and quick replies.
export const LIMITS = {
  text: 640,
  buttons: 3,
  buttonTitle: 20,
  quickReplies: 13,
  quickReplyTitle: 20,
} as const

export type MessageButton =
  | { id: string; type: "postback"; title: string }
  | { id: string; type: "url"; title: string; url: string; track: boolean }
  | { id: string; type: "profile"; title: string }

export type Message = {
  text: string
  privateReply: boolean
  buttons: MessageButton[]
  quickReplies: { id: string; title: string }[]
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

/** Problems that block publishing or are worth a warning, in the order they are shown. */
export function messageIssues(m: Message, { isFirst, locale = "es" }: { isFirst: boolean; locale?: Locale }) {
  const t = getMessages(locale).ui
  const errors: string[] = []
  const warnings: string[] = []
  if (!m.text.trim()) errors.push(t.errEmpty)
  if (m.text.length > LIMITS.text) errors.push(fmt(t.errTooLong, { n: LIMITS.text }))
  if (m.buttons.length > LIMITS.buttons) errors.push(fmt(t.errMaxButtons, { n: LIMITS.buttons }))
  for (const b of m.buttons) {
    if (!b.title.trim()) errors.push(t.errButtonEmpty)
    if (b.title.length > LIMITS.buttonTitle) warnings.push(fmt(t.warnCut, { title: b.title }))
    if (b.type === "url" && !isValidUrl(b.url)) errors.push(fmt(t.errBadUrl, { title: b.title || t.typeLink }))
  }
  if (isFirst && !m.buttons.some((b) => b.type === "postback") && !m.quickReplies.length) {
    warnings.push(t.warnNoReply)
  }
  return { errors, warnings }
}
