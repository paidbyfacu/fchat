// Dashboard reads. All of them filter by the logged-in user's accounts.

import { getDb } from "./db"

export type AccountRow = {
  id: string
  username: string
  profile_pic_url: string | null
  status: "ok" | "expired" | "missing_perms" | "disconnected"
  token_expires_at: Date
  webhooks_subscribed: boolean
  created_at: Date
}

export async function listAccounts(userId: string) {
  const db = await getDb()
  return db.query<AccountRow>(
    `select id, username, profile_pic_url, status, token_expires_at, webhooks_subscribed, created_at
     from ig_accounts where user_id = $1 order by created_at`,
    [userId],
  )
}

export type AutomationRow = {
  id: string
  name: string
  status: "draft" | "live" | "stopped"
  updated_at: Date
  username: string
  keywords: string[] | null
  post_scope: string | null
  media_ids: string[] | null
  triggered_7d: number
  link_sent_7d: number
}

export async function listAutomations(userId: string) {
  const db = await getDb()
  return db.query<AutomationRow>(
    `select a.id, a.name, a.status, a.updated_at, acc.username,
       -- no trigger, a draft never published: what the wizard says
       coalesce(t.keywords_include, array(select jsonb_array_elements_text(a.wizard->'include'))) keywords,
       coalesce(t.post_scope, a.wizard->>'scope') post_scope,
       coalesce(t.media_ids, array(select jsonb_array_elements(a.wizard->'posts')->>'id')) media_ids,
       (select count(*)::int from automation_events e where e.automation_id = a.id and e.step = 'triggered'
          and e.created_at > now() - interval '7 days') triggered_7d,
       (select count(*)::int from automation_events e where e.automation_id = a.id and e.step = 'link_sent'
          and e.created_at > now() - interval '7 days') link_sent_7d
     from automations a
     join ig_accounts acc on acc.id = a.ig_account_id
     left join lateral (select keywords_include, post_scope, media_ids from triggers where automation_id = a.id order by created_at limit 1) t on true
     where acc.user_id = $1
     order by a.created_at`,
    [userId],
  )
}

export async function getAutomation(userId: string, id: string) {
  const db = await getDb()
  const [a] = await db.query<AutomationRow & { graph: unknown }>(
    `select a.id, a.name, a.status, a.updated_at, acc.username, v.graph,
       t.keywords_include keywords, t.post_scope, t.media_ids, 0 triggered_7d, 0 link_sent_7d
     from automations a
     join ig_accounts acc on acc.id = a.ig_account_id
     left join automation_versions v on v.id = a.live_version_id
     left join lateral (select keywords_include, post_scope, media_ids from triggers where automation_id = a.id order by created_at limit 1) t on true
     where acc.user_id = $1 and a.id = $2`,
    [userId, id],
  )
  return a ?? null
}

export async function funnel(userId: string, automationId?: string) {
  const db = await getDb()
  const rows = await db.query<{ step: string; n: number }>(
    `select e.step, count(*)::int n from automation_events e
     join automations a on a.id = e.automation_id
     join ig_accounts acc on acc.id = a.ig_account_id
     where acc.user_id = $1 and ($2::uuid is null or a.id = $2) and e.created_at > now() - interval '7 days'
     group by e.step`,
    [userId, automationId ?? null],
  )
  return Object.fromEntries(rows.map((r) => [r.step, r.n])) as Record<string, number>
}

export type ContactRow = {
  id: string
  username: string | null
  igsid: string
  follows_business: boolean | null
  opted_in: boolean
  last_inbound_at: Date | null
  created_at: Date
  account: string
}

export async function listContacts(userId: string, search = "", limit = 100) {
  const db = await getDb()
  return db.query<ContactRow>(
    `select c.id, c.username, c.igsid, c.follows_business, c.opted_in, c.last_inbound_at, c.created_at, acc.username account
     from contacts c join ig_accounts acc on acc.id = c.ig_account_id
     where acc.user_id = $1 and ($2 = '' or c.username ilike '%' || $2 || '%')
     order by coalesce(c.last_message_at, c.created_at) desc
     limit $3`,
    [userId, search, limit],
  )
}

export type ActivityRow = { at: Date; username: string | null; text: string; status: string; automation: string | null }

export async function recentComments(userId: string, limit = 8) {
  const db = await getDb()
  return db.query<ActivityRow>(
    `select ce.created_at at, ce.username, ce.text, ce.status, a.name automation
     from comment_events ce
     join ig_accounts acc on acc.id = ce.ig_account_id
     left join triggers t on t.id = ce.trigger_id
     left join automations a on a.id = t.automation_id
     where acc.user_id = $1
     order by ce.created_at desc limit $2`,
    [userId, limit],
  )
}

/** Unread messages in open conversations, for the Inbox count in the menu. */
export async function unreadTotal(userId: string) {
  const db = await getDb()
  const [r] = await db.query<{ n: number }>(
    `select coalesce(sum(c.unread_count), 0)::int n
     from contacts c join ig_accounts acc on acc.id = c.ig_account_id
     where acc.user_id = $1 and c.inbox_status = 'open'`,
    [userId],
  )
  return r?.n ?? 0
}

export type HomeSummary = {
  accounts: number
  contacts: number
  automations: number
  live: number
  comments: number
  humanReplies: number
}

/** Numbers for the home page and its next steps. */
export async function homeSummary(userId: string): Promise<HomeSummary> {
  const db = await getDb()
  const [r] = await db.query<HomeSummary>(
    `select
       (select count(*)::int from ig_accounts where user_id = $1) accounts,
       (select count(*)::int from contacts c join ig_accounts acc on acc.id = c.ig_account_id where acc.user_id = $1) contacts,
       (select count(*)::int from automations a join ig_accounts acc on acc.id = a.ig_account_id where acc.user_id = $1) automations,
       (select count(*)::int from automations a join ig_accounts acc on acc.id = a.ig_account_id
          where acc.user_id = $1 and a.status = 'live') live,
       (select count(*)::int from comment_events ce join ig_accounts acc on acc.id = ce.ig_account_id where acc.user_id = $1) comments,
       (select count(*)::int from messages m join contacts c on c.id = m.contact_id join ig_accounts acc on acc.id = c.ig_account_id
          where acc.user_id = $1 and m.sent_by = 'human' and m.kind <> 'note' and m.mid is not null) "humanReplies"`,
    [userId],
  )
  return r
}
