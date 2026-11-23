// From the wizard to the graph and the trigger. And back, to open in the wizard an
// automation that was not created with it, like the one seeded in milestone 1.

import { normalizeKeyword } from "@/lib/keywords"
import { defaultWizard, type Wizard } from "@/lib/wizard"
import { getMessages } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/locale"
import type { Graph, GraphNode, SendMessageNode } from "./graph"

export type CompiledTrigger = {
  post_scope: "specific" | "any" | "next"
  media_ids: string[]
  keywords_include: string[]
  keywords_exclude: string[]
  match: "any" | "contains"
  public_replies: string[]
}

const clean = (words: string[]) => [...new Set(words.map(normalizeKeyword).filter(Boolean))]

/** `locale` is the language of the fixed texts the person receives, like the profile button. */
export function compileWizard(w: Wizard, locale: Locale = "es"): { graph: Graph; trigger: CompiledTrigger } {
  const nodes: GraphNode[] = [
    {
      id: "open",
      type: "send_message",
      private_reply: true,
      text: w.opening.text.trim(),
      buttons: [{ id: "yes", type: "postback", title: w.opening.button.trim(), next: w.askFollow.on ? "check" : "link" }],
      step: "dm_sent",
    },
  ]
  if (w.askFollow.on) {
    nodes.push(
      { id: "check", type: "check_follow", yes: "link", no: "ask" },
      {
        id: "ask",
        type: "send_message",
        text: w.askFollow.text.trim(),
        buttons: [
          { id: "profile", type: "profile", title: getMessages(locale).wizard.goToProfile },
          { id: "done", type: "postback", title: w.askFollow.button.trim(), next: "check" },
        ],
        // 0 = until they follow: no limit, the link never reaches someone who does not follow
        ...(w.askFollow.maxAsks > 0 ? { max_loops: w.askFollow.maxAsks, on_max: "link" } : {}),
        step: "follow_asked",
      },
    )
  }
  nodes.push({
    id: "link",
    type: "send_message",
    text: w.link.text.trim(),
    buttons: w.link.links.slice(0, 3).map((l, i) => ({ id: `l${i}`, type: "url" as const, title: l.title.trim(), url: l.url.trim() })),
    step: "link_sent",
  })
  return {
    graph: { start: "open", nodes },
    trigger: {
      post_scope: w.scope,
      media_ids: w.scope === "specific" ? [...new Set(w.posts.map((p) => p.id))] : [],
      keywords_include: w.match === "words" ? clean(w.include) : [],
      keywords_exclude: clean(w.exclude),
      match: w.match === "words" ? "contains" : "any",
      public_replies: w.publicReplies.on ? w.publicReplies.texts.map((t) => t.trim()).filter(Boolean) : [],
    },
  }
}

/** Rebuilds the wizard from the graph and the trigger, when its state was not saved. */
export function wizardFromGraph(
  base: { name: string; accountId: string },
  graph: Graph | null,
  t: { post_scope: string | null; media_ids: string[] | null; keywords_include: string[] | null; keywords_exclude: string[] | null; public_replies: string[] | null } | null,
): Wizard {
  const w = defaultWizard(base.accountId)
  w.name = base.name
  const node = (id: string) => graph?.nodes.find((n) => n.id === id) as SendMessageNode | undefined
  const open = node("open")
  if (open) w.opening = { text: open.text, button: open.buttons?.find((b) => b.type === "postback")?.title ?? w.opening.button }
  const ask = node("ask")
  w.askFollow = ask
    ? { on: true, text: ask.text, button: ask.buttons?.find((b) => b.type === "postback")?.title ?? w.askFollow.button, maxAsks: ask.max_loops ?? 0 }
    : { ...w.askFollow, on: false }
  const link = node("link")
  if (link) {
    w.link = {
      text: link.text,
      links: (link.buttons ?? []).flatMap((b) => (b.type === "url" ? [{ title: b.title, url: b.url }] : [])),
    }
  }
  if (t) {
    w.scope = (t.post_scope as Wizard["scope"]) ?? "any"
    w.posts = (t.media_ids ?? []).map((id) => ({ id }))
    w.include = t.keywords_include ?? []
    w.exclude = t.keywords_exclude ?? []
    w.match = w.include.length ? "words" : "any"
    w.publicReplies = t.public_replies?.length ? { on: true, texts: t.public_replies } : { ...w.publicReplies, on: false }
  }
  return w
}
