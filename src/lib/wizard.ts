// The "comment → DM" wizard (S05): its state, defaults and validation. Used by the
// screen, to warn while typing, and by the server, so nothing broken gets published.
// No server imports.

import { LIMITS, isValidUrl, type Message } from "./message"
import { normalizeKeyword } from "./keywords"
import { fmt, type Locale } from "./i18n/locale"
import { getMessages } from "./i18n"

export type PostScope = "specific" | "any" | "next"

export type PickedPost = { id: string; caption?: string; thumbnail?: string; timestamp?: string; permalink?: string }

export type Wizard = {
  name: string
  accountId: string
  scope: PostScope
  /** Chosen posts when scope = specific, one or more. */
  posts: PickedPost[]
  match: "words" | "any"
  include: string[]
  exclude: string[]
  publicReplies: { on: boolean; texts: string[] }
  opening: { text: string; button: string }
  /** maxAsks 0: ask until they follow, never sending the link to non-followers. */
  askFollow: { on: boolean; text: string; button: string; maxAsks: number }
  link: { text: string; links: { title: string; url: string }[] }
}

export const MAX_POSTS = 30
export const MAX_PUBLIC_REPLIES = 10

/** A new wizard with the default texts in the dashboard language. */
export function defaultWizard(accountId: string, locale: Locale = "es"): Wizard {
  const t = getMessages(locale).wizard
  return {
    name: "",
    accountId,
    scope: "specific",
    posts: [],
    match: "words",
    include: [],
    exclude: [],
    publicReplies: { on: true, texts: [t.reply1, t.reply2, t.reply3] },
    opening: { text: t.openingText, button: t.openingButton },
    askFollow: { on: true, text: t.askText, button: t.askButton, maxAsks: 0 },
    link: { text: t.linkText, links: [{ title: t.linkButton, url: "https://" }] },
  }
}

export type WizardIssue = { field: string; message: string }

export function validateWizard(w: Wizard, locale: Locale = "es"): WizardIssue[] {
  const t = getMessages(locale).wizard
  const out: WizardIssue[] = []
  const add = (field: string, message: string) => out.push({ field, message })
  if (!w.name.trim()) add("name", t.errName)
  if (w.name.length > 80) add("name", t.errNameLong)
  if (!w.accountId) add("accountId", t.errAccount)
  if (w.scope === "specific" && w.posts.length === 0) add("posts", t.errPosts)
  if (w.posts.length > MAX_POSTS) add("posts", fmt(t.errPostsMax, { n: MAX_POSTS }))
  if (w.match === "words" && !w.include.some((k) => normalizeKeyword(k))) add("include", t.errInclude)
  if (w.publicReplies.on) {
    const texts = w.publicReplies.texts.filter((x) => x.trim())
    if (!texts.length) add("publicReplies", t.errPublic)
    if (texts.some((x) => x.length > 300)) add("publicReplies", t.errPublicLong)
    if (texts.some((x) => !/[\p{Letter}\p{Number}]/u.test(x))) add("publicReplies", t.errPublicEmoji)
  }
  const text = (field: string, value: string, label: string) => {
    if (!value.trim()) add(field, fmt(t.errText, { label }))
    if (value.length > LIMITS.text) add(field, fmt(t.errTextLong, { label, n: LIMITS.text }))
  }
  const button = (field: string, value: string, label: string) => {
    if (!value.trim()) add(field, fmt(t.errButton, { label }))
    if (value.length > LIMITS.buttonTitle) add(field, fmt(t.errButtonLong, { label, n: LIMITS.buttonTitle }))
  }
  text("opening", w.opening.text, t.labelOpening)
  button("opening", w.opening.button, t.labelOpening)
  if (w.askFollow.on) {
    text("askFollow", w.askFollow.text, t.labelAsk)
    button("askFollow", w.askFollow.button, t.labelAsk)
    if (!Number.isInteger(w.askFollow.maxAsks) || w.askFollow.maxAsks < 0 || w.askFollow.maxAsks > 5) add("askFollow", t.errMaxAsks)
  }
  text("link", w.link.text, t.labelLink)
  if (w.link.links.length > LIMITS.buttons) add("link", fmt(t.errLinksMax, { n: LIMITS.buttons }))
  w.link.links.forEach((l, i) => {
    const label = fmt(t.labelLinkN, { n: i + 1 })
    button("link", l.title, label)
    if (!isValidUrl(l.url) || l.url === "https://") add("link", fmt(t.errUrl, { label }))
  })
  return out
}

/** The messages as the person would see them, for the preview. */
export function previewMessages(w: Wizard, locale: Locale = "es"): Message[] {
  const msgs: Message[] = [
    { text: w.opening.text, privateReply: true, buttons: [{ id: "yes", type: "postback", title: w.opening.button }], quickReplies: [] },
  ]
  if (w.askFollow.on) {
    msgs.push({
      text: w.askFollow.text,
      privateReply: false,
      buttons: [
        { id: "profile", type: "profile", title: getMessages(locale).wizard.goToProfile },
        { id: "done", type: "postback", title: w.askFollow.button },
      ],
      quickReplies: [],
    })
  }
  msgs.push({
    text: w.link.text,
    privateReply: false,
    buttons: w.link.links.map((l, i) => ({ id: `l${i}`, type: "url" as const, title: l.title, url: l.url, track: false })),
    quickReplies: [],
  })
  return msgs
}
