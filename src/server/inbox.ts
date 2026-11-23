// Inbox reads: the conversation list and the history of one.
// Everything is filtered by the logged-in user's accounts.

import { getMessages } from "@/lib/i18n"
import { fmt, type Locale } from "@/lib/i18n/locale"
import { getDb } from "./db"

export type InboxFolder = "all" | "reminders" | "starred"
export type InboxStatus = "open" | "closed"
export type InboxSort = "new" | "old"

export type InboxFilters = {
  folder: InboxFolder
  status: InboxStatus
  unread: boolean
  sort: InboxSort
  q: string
}

export type InboxRow = {
  id: string
  username: string | null
  name: string | null
  profile_pic_url: string | null
  unread_count: number
  last_message_at: Date
  last_inbound_at: Date | null
  starred: boolean
  remind_at: Date | null
  inbox_status: InboxStatus
  account: string
  last_kind: string | null
  last_direction: "in" | "out" | null
  last_body: unknown
  last_sent_by: string | null
}

export async function listConversations(userId: string, f: InboxFilters, limit = 100) {
  const db = await getDb()
  const order = f.folder === "reminders" ? "c.remind_at asc" : f.sort === "old" ? "c.last_message_at asc" : "c.last_message_at desc"
  return db.query<InboxRow>(
    `select c.id, c.username, c.name, c.profile_pic_url, c.unread_count, c.last_message_at, c.last_inbound_at,
       c.starred, c.remind_at, c.inbox_status, acc.username account,
       m.kind last_kind, m.direction last_direction, m.body last_body, m.sent_by last_sent_by
     from contacts c
     join ig_accounts acc on acc.id = c.ig_account_id
     left join lateral (
       select kind, direction, body, sent_by from messages
       where contact_id = c.id and kind <> 'note' order by created_at desc limit 1
     ) m on true
     where acc.user_id = $1 and c.last_message_at is not null
       and ($2 <> 'starred' or c.starred)
       and ($2 <> 'reminders' or c.remind_at is not null)
       and ($2 = 'reminders' or c.inbox_status = $3)
       and (not $4 or c.unread_count > 0)
       and ($5 = '' or c.username ilike '%' || $5 || '%' or c.name ilike '%' || $5 || '%')
     order by ${order}
     limit $6`,
    [userId, f.folder, f.status, f.unread, f.q, limit],
  )
}

export type InboxCounts = { open: number; closed: number; reminders: number; starred: number; unread: number }

export async function inboxCounts(userId: string): Promise<InboxCounts> {
  const db = await getDb()
  const [r] = await db.query<InboxCounts>(
    `select
       count(*) filter (where c.inbox_status = 'open')::int open,
       count(*) filter (where c.inbox_status = 'closed')::int closed,
       count(*) filter (where c.remind_at is not null)::int reminders,
       count(*) filter (where c.starred)::int starred,
       count(*) filter (where c.inbox_status = 'open' and c.unread_count > 0)::int unread
     from contacts c join ig_accounts acc on acc.id = c.ig_account_id
     where acc.user_id = $1 and c.last_message_at is not null`,
    [userId],
  )
  return r ?? { open: 0, closed: 0, reminders: 0, starred: 0, unread: 0 }
}

export type ConversationContact = {
  id: string
  igsid: string
  username: string | null
  name: string | null
  profile_pic_url: string | null
  follows_business: boolean | null
  opted_in: boolean
  last_inbound_at: Date | null
  unread_count: number
  starred: boolean
  remind_at: Date | null
  inbox_status: InboxStatus
  created_at: Date
  account: string
  account_id: string
}

export async function getConversationContact(userId: string, contactId: string) {
  const db = await getDb()
  const [c] = await db.query<ConversationContact>(
    `select c.id, c.igsid, c.username, c.name, c.profile_pic_url, c.follows_business, c.opted_in, c.last_inbound_at,
       c.unread_count, c.starred, c.remind_at, c.inbox_status, c.created_at, acc.username account, acc.id account_id
     from contacts c join ig_accounts acc on acc.id = c.ig_account_id
     where acc.user_id = $1 and c.id = $2`,
    [userId, contactId],
  )
  return c ?? null
}

export type TimelineItem =
  | {
      type: "message"
      id: string
      at: Date
      direction: "in" | "out"
      kind: string
      body: unknown
      sent_by: string | null
      error: { message?: string } | null
      automation: string | null
    }
  | { type: "comment"; id: string; at: Date; text: string; status: string; automation: string | null }

/** Messages and comments of one person, oldest first. */
export async function conversationTimeline(userId: string, contactId: string, limit = 200): Promise<TimelineItem[]> {
  const db = await getDb()
  const [messages, comments] = await Promise.all([
    db.query<{
      id: string
      at: Date
      direction: "in" | "out"
      kind: string
      body: unknown
      sent_by: string | null
      error: { message?: string } | null
      automation: string | null
    }>(
      `select * from (
         select m.id, m.created_at at, m.direction, m.kind, m.body, m.sent_by, m.error, a.name automation
         from messages m
         join contacts c on c.id = m.contact_id
         join ig_accounts acc on acc.id = c.ig_account_id
         left join flow_runs r on r.id = m.run_id
         left join automations a on a.id = r.automation_id
         where acc.user_id = $1 and m.contact_id = $2
         order by m.created_at desc limit $3
       ) t order by at`,
      [userId, contactId, limit],
    ),
    db.query<{ id: string; at: Date; text: string; status: string; automation: string | null }>(
      `select ce.id, ce.created_at at, ce.text, ce.status, a.name automation
       from comment_events ce
       join ig_accounts acc on acc.id = ce.ig_account_id
       left join triggers t on t.id = ce.trigger_id
       left join automations a on a.id = t.automation_id
       where acc.user_id = $1 and ce.contact_id = $2
       order by ce.created_at desc limit 50`,
      [userId, contactId],
    ),
  ])
  const items: TimelineItem[] = [
    ...messages.map((m) => ({ type: "message" as const, ...m })),
    ...comments.map((c) => ({ type: "comment" as const, ...c })),
  ]
  return items.sort((a, b) => a.at.getTime() - b.at.getTime())
}

/** Short text of a message for the conversation list. */
export function messagePreview(kind: string | null, body: unknown, direction: "in" | "out" | null, locale: Locale = "es"): string {
  if (!kind) return ""
  const t = getMessages(locale).inbox
  const b = (body ?? {}) as Record<string, unknown>
  const text = messageText(kind, b)
  const mine = direction === "out" ? t.previewYou : ""
  if (kind === "postback") return fmt(t.previewTapped, { title: String(b.title ?? t.previewAButton) })
  if (kind === "media") return direction === "out" ? t.previewYouFile : t.sentFile
  if (kind === "story_reply") return t.storyReply
  return text ? `${mine}${text}` : `${mine}${t.previewMessage}`
}

/** The visible text of a stored message: plain text, a template with buttons or a quick reply. */
export function messageText(kind: string, body: Record<string, unknown>): string {
  if (typeof body.text === "string") return body.text
  const att = body.attachment as { payload?: { text?: string } } | undefined
  if (att?.payload?.text) return att.payload.text
  if (kind === "postback" && typeof body.title === "string") return body.title
  return ""
}

export function messageButtons(body: unknown): { title: string; url?: string }[] {
  const b = (body ?? {}) as Record<string, unknown>
  const att = b.attachment as { payload?: { buttons?: { title?: string; url?: string }[] } } | undefined
  const buttons = att?.payload?.buttons ?? []
  const quick = (b.quick_replies as { title?: string }[] | undefined) ?? []
  return [...buttons, ...quick].filter((x) => x.title).map((x) => ({ title: String(x.title), url: (x as { url?: string }).url }))
}
