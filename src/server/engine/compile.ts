// Del asistente al grafo y al trigger. Y al revés, para abrir en el asistente
// una automatización que no se creó con él (la sembrada del hito 1).

import { normalizeKeyword } from "@/lib/keywords"
import { defaultWizard, type Wizard } from "@/lib/wizard"
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

export function compileWizard(w: Wizard): { graph: Graph; trigger: CompiledTrigger } {
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
          { id: "profile", type: "profile", title: "Ir al perfil" },
          { id: "done", type: "postback", title: w.askFollow.button.trim(), next: "check" },
        ],
        // 0 = hasta que siga: sin tope, el link nunca llega a quien no sigue
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

/** Reconstruye el asistente desde el grafo y el trigger (si no se guardó el estado). */
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
