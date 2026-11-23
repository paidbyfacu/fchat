// An automation's graph, automation_versions.graph, and its translation into
// Instagram messages. The wizard of milestone 2 and the visual editor of milestone 4
// produce this same format.

import type { IgMessage } from "../instagram"

export type FunnelStep = "dm_sent" | "follow_asked" | "link_sent" | "reminder_sent"

export type GraphButton =
  | { id: string; type: "postback"; title: string; next?: string }
  | { id: string; type: "url"; title: string; url: string }
  | { id: string; type: "profile"; title: string }

export type SendMessageNode = {
  id: string
  type: "send_message"
  private_reply?: boolean
  text: string
  buttons?: GraphButton[]
  quick_replies?: { id: string; title: string; next?: string }[]
  next?: string
  /** how many times this node can repeat in one run, as with "Following" */
  max_loops?: number
  on_max?: string
  step?: FunnelStep
}

export type CheckFollowNode = { id: string; type: "check_follow"; yes: string; no: string }

export type GraphNode = SendMessageNode | CheckFollowNode

export type Graph = { start: string; nodes: GraphNode[] }

export function findNode(g: Graph, id: string | null | undefined): GraphNode | undefined {
  return id ? g.nodes.find((n) => n.id === id) : undefined
}

/** The node waits for a tap if it has any reply button or quick reply. */
export function waitsForTap(n: SendMessageNode): boolean {
  return Boolean(n.buttons?.some((b) => b.type === "postback") || n.quick_replies?.length)
}

/** Next node when a button or quick reply of this node is tapped. */
export function nextAfterTap(n: SendMessageNode, buttonId: string): { found: boolean; next?: string } {
  const b = n.buttons?.find((x) => x.id === buttonId)
  if (b) return { found: true, next: b.type === "postback" ? b.next : undefined }
  const q = n.quick_replies?.find((x) => x.id === buttonId)
  if (q) return { found: true, next: q.next }
  return { found: false }
}

export const payloadFor = (runId: string, buttonId: string) => `r:${runId}:${buttonId}`

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parsePayload(payload: string | undefined): { runId: string; buttonId: string } | null {
  const m = payload?.match(/^r:([^:]+):([\w-]{1,40})$/)
  return m && UUID.test(m[1]) ? { runId: m[1], buttonId: m[2] } : null
}

export function toIgMessage(n: SendMessageNode, runId: string, username: string): IgMessage {
  if (n.buttons?.length) {
    return {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: n.text,
          buttons: n.buttons.map((b) =>
            b.type === "postback"
              ? { type: "postback" as const, title: b.title, payload: payloadFor(runId, b.id) }
              : {
                  type: "web_url" as const,
                  title: b.title,
                  url: b.type === "url" ? b.url : `https://www.instagram.com/${username}`,
                },
          ),
        },
      },
    }
  }
  if (n.quick_replies?.length) {
    return {
      text: n.text,
      quick_replies: n.quick_replies.map((q) => ({ content_type: "text" as const, title: q.title, payload: payloadFor(runId, q.id) })),
    }
  }
  return { text: n.text }
}

/** The core automation: comment → DM → do you follow me? → link. */
export function commentToDmGraph(o: {
  opening: string
  openingButton: string
  followPrompt: string
  followedButton: string
  linkText: string
  links: { title: string; url: string }[]
  maxFollowAsks?: number
  /** Text of the button that opens the profile, in the language of the other texts. */
  profileButton?: string
}): Graph {
  return {
    start: "open",
    nodes: [
      {
        id: "open",
        type: "send_message",
        private_reply: true,
        text: o.opening,
        buttons: [{ id: "yes", type: "postback", title: o.openingButton, next: "check" }],
        step: "dm_sent",
      },
      { id: "check", type: "check_follow", yes: "link", no: "ask" },
      {
        id: "ask",
        type: "send_message",
        text: o.followPrompt,
        buttons: [
          { id: "profile", type: "profile", title: o.profileButton ?? "Ir al perfil" },
          { id: "done", type: "postback", title: o.followedButton, next: "check" },
        ],
        // 0 = until they follow, no limit
        ...(o.maxFollowAsks === 0 ? {} : { max_loops: o.maxFollowAsks ?? 3, on_max: "link" }),
        step: "follow_asked",
      },
      {
        id: "link",
        type: "send_message",
        text: o.linkText,
        buttons: o.links.slice(0, 3).map((l, i) => ({ id: `l${i}`, type: "url" as const, title: l.title, url: l.url })),
        step: "link_sent",
      },
    ],
  }
}
