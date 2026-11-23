// The engine: takes events from webhook_events and runs the automations.
//
//   comment → which trigger applies? → contact + run → private reply
//   button tap → opens the 24 h window → follows the graph
//   check_follow → is_user_follow_business → yes / no branch
//
// Each event is claimed by marking it 'done' before processing it, at most once.
// Whatever fails stays 'failed' with the error. Repeated sends are prevented by
// the database unique constraints and the run's optimistic advance.

import type { Db } from "../db"
import { decrypt } from "../crypto"
import { IgError, type IgRecipient, type InstagramClient } from "../instagram"
import { matchesKeyword } from "@/lib/keywords"
import {
  type Graph,
  type SendMessageNode,
  findNode,
  nextAfterTap,
  parsePayload,
  toIgMessage,
  waitsForTap,
} from "./graph"

export type EngineDeps = {
  db: Db
  ig: InstagramClient
  encKey: string
  now?: () => Date
  log?: (msg: string, data?: unknown) => void
}

const HOUR = 3600_000
const WINDOW_MS = 24 * HOUR
const PRIVATE_REPLY_MS = 7 * 24 * HOUR

type Account = { id: string; ig_user_id: string; username: string; access_token_enc: Uint8Array; status: string }
type Contact = { id: string; igsid: string; last_inbound_at: Date | null }
type Run = {
  id: string
  contact_id: string
  automation_id: string
  version_id: string
  comment_event_id: string | null
  current_node: string | null
  status: string
  attempts?: number
  vars: { loops?: Record<string, number> }
}
type Trigger = {
  id: string
  automation_id: string
  post_scope: "specific" | "any" | "next"
  media_id: string | null
  media_ids: string[]
  public_replies: string[]
  keywords_include: string[]
  keywords_exclude: string[]
  match: "any" | "contains" | "exact"
  armed_at: Date | null
}

type Ctx = EngineDeps & { account: Account; token: string; graph: Graph; contact: Contact; run: Run }

const isUnique = (e: unknown) => (e as { code?: string })?.code === "23505"

/** Waits between retries of a send, in minutes. They cover Meta's one-hour limit window. */
const RETRY_DELAYS_MIN = [1, 3, 10, 20, 30, 45]

/** Errors that fix themselves by waiting: Meta usage limits, 5xx errors, network or timeout. */
function isTransient(e: unknown): boolean {
  if (!(e instanceof IgError)) return true
  if (e.status >= 500) return true
  return e.code !== undefined && [1, 2, 4, 17, 32, 341, 613].includes(e.code)
}

// ─── cola ────────────────────────────────────────────────────────────────

export async function processPending(deps: EngineDeps, limit = 25): Promise<number> {
  let n = 0
  for (; n < limit; n++) {
    const [ev] = await deps.db.query<{ id: string; field: string; ig_user_id: string; payload: unknown }>(
      `update webhook_events set status = 'done', processed_at = now()
       where id = (select id from webhook_events where status = 'pending'
                   order by received_at limit 1 for update skip locked)
       returning id, field, ig_user_id, payload`,
    )
    if (!ev) break
    deps.log?.("event", { field: ev.field, id: ev.id })
    try {
      await processEvent(deps, ev)
    } catch (e) {
      deps.log?.("event failed", { id: ev.id, error: String(e) })
      await deps.db.query(`update webhook_events set status = 'failed', error = $2 where id = $1`, [ev.id, String(e)])
    }
  }
  return n
}

async function processEvent(deps: EngineDeps, ev: { id: string; field: string; ig_user_id: string; payload: unknown }) {
  const [account] = await deps.db.query<Account>(
    `select id, ig_user_id, username, access_token_enc, status from ig_accounts where ig_user_id = $1`,
    [ev.ig_user_id],
  )
  if (!account || account.status !== "ok") {
    await deps.db.query(`update webhook_events set status = 'ignored', error = 'unknown or inactive account' where id = $1`, [ev.id])
    return
  }
  const token = decrypt(account.access_token_enc, deps.encKey)
  if (ev.field === "comments") return onComment(deps, account, token, ev.payload as CommentValue)
  const m = ev.payload as MessagingEvent
  if (m.postback) return onTap(deps, account, token, m.sender.id, m.postback.payload, m.postback.title)
  if (m.message?.quick_reply) return onTap(deps, account, token, m.sender.id, m.message.quick_reply.payload, m.message.text)
  if (m.message) return onInboundText(deps, account, m)
}

// ─── comentarios ─────────────────────────────────────────────────────────

type CommentValue = {
  id: string
  text?: string
  from?: { id?: string; username?: string }
  media?: { id?: string }
  parent_id?: string
}

async function onComment(deps: EngineDeps, account: Account, token: string, c: CommentValue) {
  const { db } = deps
  const igsid = c.from?.id
  const mediaId = c.media?.id
  if (!igsid || !mediaId) return
  if (igsid === account.ig_user_id) return // our own comments and public replies

  const [ce] = await db.query<{ id: string }>(
    `insert into comment_events (ig_account_id, comment_id, media_id, igsid, username, text, commented_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (ig_account_id, comment_id) do nothing returning id`,
    [account.id, c.id, mediaId, igsid, c.from?.username ?? null, c.text ?? ""],
  )
  if (!ce) return // already seen

  const trigger = await matchTrigger(deps, account, token, mediaId, c.text ?? "")
  if (!trigger) {
    await db.query(`update comment_events set status = 'ignored' where id = $1`, [ce.id])
    return
  }

  const [auto] = await db.query<{ live_version_id: string; graph: Graph }>(
    `select a.live_version_id, v.graph from automations a
     join automation_versions v on v.id = a.live_version_id
     where a.id = $1 and a.status = 'live'`,
    [trigger.automation_id],
  )
  if (!auto) {
    await db.query(`update comment_events set status = 'ignored' where id = $1`, [ce.id])
    return
  }

  const contact = await upsertContact(db, account.id, igsid, c.from?.username)
  try {
    await db.query(`update comment_events set status = 'matched', trigger_id = $2, contact_id = $3 where id = $1`, [
      ce.id,
      trigger.id,
      contact.id,
    ])
  } catch (e) {
    if (!isUnique(e)) throw e
    // we already replied to this person on this post with this trigger
    await db.query(
      `update comment_events set status = 'ignored', contact_id = $2, error = '{"reason":"already answered on this post"}' where id = $1`,
      [ce.id, contact.id],
    )
    return
  }

  // if they had a live run of this automation, it is cancelled and a new one starts
  await db.query(
    `update flow_runs set status = 'cancelled', finished_at = now()
     where contact_id = $1 and automation_id = $2 and status in ('running','waiting')`,
    [contact.id, trigger.automation_id],
  )
  const [run] = await db.query<Run>(
    `insert into flow_runs (contact_id, automation_id, version_id, comment_event_id)
     values ($1, $2, $3, $4) returning *`,
    [contact.id, trigger.automation_id, auto.live_version_id, ce.id],
  )
  await event(db, run, "triggered")
  await advance({ ...deps, account, token, graph: auto.graph, contact, run }, auto.graph.start, null)
  await publicReply(deps, token, ce.id, c.id, trigger, run)
}

/** A random reply under the comment, only if the DM went out. If it fails, nothing stops. */
async function publicReply(deps: EngineDeps, token: string, ceId: string, commentId: string, trigger: Trigger, run: Run) {
  if (!trigger.public_replies.length) return
  const [ce] = await deps.db.query<{ status: string }>(`select status from comment_events where id = $1`, [ceId])
  if (ce?.status !== "replied") return
  const text = trigger.public_replies[Math.floor(Math.random() * trigger.public_replies.length)]
  try {
    const r = await deps.ig.replyToComment(token, commentId, text)
    await deps.db.query(`update comment_events set public_reply_id = $2 where id = $1`, [ceId, r.id])
    await event(deps.db, run, "public_replied")
  } catch (e) {
    deps.log?.("public reply failed", { comment: commentId, error: String(e) })
  }
}

async function matchTrigger(deps: EngineDeps, account: Account, token: string, mediaId: string, text: string) {
  const triggers = await deps.db.query<Trigger>(
    `select t.* from triggers t join automations a on a.id = t.automation_id
     where t.ig_account_id = $1 and t.type = 'comment' and t.is_active and a.status = 'live'
     order by t.created_at`,
    [account.id],
  )
  const ok = (t: Trigger) => {
    if (t.keywords_exclude.some((k) => matchesKeyword(text, k))) return false
    if (t.match === "any" || t.keywords_include.length === 0) return true
    return t.keywords_include.some((k) => matchesKeyword(text, k))
  }
  // first the ones with keywords, which are more specific, then the generic ones; within each group, the oldest
  const ordered = [...triggers.filter((t) => t.keywords_include.length), ...triggers.filter((t) => !t.keywords_include.length)]
  for (const t of ordered) {
    if (!ok(t)) continue
    if (t.post_scope === "specific" && !t.media_ids.includes(mediaId)) continue
    if (t.post_scope === "next") {
      if (t.media_id && t.media_id !== mediaId) continue
      if (!t.media_id) {
        // Instagram does not notify new posts: the first comment on a new post assigns it
        const media = await deps.ig.getMedia(token, mediaId).catch(() => null)
        if (!media || !t.armed_at || new Date(media.timestamp) <= t.armed_at) continue
        await deps.db.query(`update triggers set media_id = $2 where id = $1 and media_id is null`, [t.id, mediaId])
      }
    }
    return t
  }
  return null
}

// ─── button taps and messages ──────────────────────────────────────────────

type MessagingEvent = {
  sender: { id: string }
  timestamp?: number
  postback?: { payload?: string; title?: string; mid?: string }
  message?: { mid?: string; text?: string; quick_reply?: { payload?: string } }
}

async function onTap(
  deps: EngineDeps,
  account: Account,
  token: string,
  sender: string,
  payload: string | undefined,
  title: string | undefined,
) {
  const { db } = deps
  const contact = await upsertContact(db, account.id, sender, undefined, { inbound: true })
  await db.query(`insert into messages (contact_id, direction, kind, body) values ($1, 'in', 'postback', $2)`, [
    contact.id,
    JSON.stringify({ payload, title }),
  ])
  const p = parsePayload(payload)
  if (!p) return
  const [run] = await db.query<Run>(`select * from flow_runs where id = $1 and contact_id = $2`, [p.runId, contact.id])
  if (!run || run.status !== "waiting") return // not this person's, or it already moved on, as in a repeated tap
  const [v] = await db.query<{ graph: Graph }>(`select graph from automation_versions where id = $1`, [run.version_id])
  const node = findNode(v.graph, run.current_node)
  if (!node || node.type !== "send_message") return
  const tap = nextAfterTap(node, p.buttonId)
  if (!tap.found) return
  const [claimed] = await db.query<Run>(
    `update flow_runs set status = 'running', waiting_for = null where id = $1 and status = 'waiting' returning *`,
    [run.id],
  )
  if (!claimed) return
  if (node.private_reply) await event(db, claimed, "opened")
  const ctx: Ctx = { ...deps, account, token, graph: v.graph, contact, run: claimed }
  if (tap.next) await advance(ctx, tap.next, claimed.current_node)
  else await finish(db, claimed.id, "done")
}

async function onInboundText(deps: EngineDeps, account: Account, m: MessagingEvent) {
  const contact = await upsertContact(deps.db, account.id, m.sender.id, undefined, { inbound: true })
  await deps.db.query(`insert into messages (contact_id, direction, mid, kind, body) values ($1, 'in', $2, 'text', $3) on conflict do nothing`, [
    contact.id,
    m.message?.mid ?? null,
    JSON.stringify({ text: m.message?.text ?? "" }),
  ])
  // Keyword triggers in DMs: milestone 3.
}

// ─── graph execution ─────────────────────────────────────────────────────

async function advance(ctx: Ctx, startId: string, expectedNode: string | null) {
  const { db } = ctx
  let id: string | undefined = startId
  let expected = expectedNode
  for (let guard = 0; id && guard < 25; guard++) {
    const node = findNode(ctx.graph, id)
    if (!node) return fail(ctx, `nodo inexistente: ${id}`)

    // optimistic advance: if another process already moved the run, this one stops
    const [moved] = await db.query<Run>(
      `update flow_runs set current_node = $2 where id = $1 and status = 'running'
       and current_node is not distinct from $3 returning *`,
      [ctx.run.id, node.id, expected],
    )
    if (!moved) return
    ctx.run = moved
    expected = node.id

    if (node.type === "check_follow") {
      const follows = await checkFollow(ctx)
      if (follows) await event(db, ctx.run, "followed")
      id = follows ? node.yes : node.no
      continue
    }

    // send_message. Without max_loops the node repeats with no limit: "until they follow".
    const loops = ctx.run.vars.loops?.[node.id] ?? 0
    if (node.max_loops && loops >= node.max_loops) {
      id = node.on_max
      continue
    }
    const sent = await send(ctx, node)
    if (!sent) return
    // counted after sending: a send that failed and is retried does not use up an ask
    if (node.max_loops) {
      const vars = { ...ctx.run.vars, loops: { ...ctx.run.vars.loops, [node.id]: loops + 1 } }
      await db.query(`update flow_runs set vars = $2 where id = $1`, [ctx.run.id, JSON.stringify(vars)])
      ctx.run.vars = vars
    }
    if (waitsForTap(node)) {
      await db.query(`update flow_runs set status = 'waiting', waiting_for = 'button' where id = $1`, [ctx.run.id])
      return
    }
    id = node.next
  }
  await finish(db, ctx.run.id, "done")
}

async function send(ctx: Ctx, node: SendMessageNode): Promise<boolean> {
  const { db, ig } = ctx
  const now = (ctx.now ?? (() => new Date()))()
  let recipient: IgRecipient
  if (node.private_reply) {
    const [ce] = await db.query<{ comment_id: string; created_at: Date }>(
      `select comment_id, created_at from comment_events where id = $1`,
      [ctx.run.comment_event_id],
    )
    if (!ce) return fail(ctx, "private reply without a comment")
    if (now.getTime() - ce.created_at.getTime() > PRIVATE_REPLY_MS) return expire(ctx, "more than 7 days have passed since the comment")
    recipient = { comment_id: ce.comment_id }
  } else {
    const [c] = await db.query<Contact>(`select id, igsid, last_inbound_at from contacts where id = $1`, [ctx.contact.id])
    if (!c.last_inbound_at || now.getTime() - c.last_inbound_at.getTime() > WINDOW_MS) {
      return expire(ctx, "the 24 h window is closed")
    }
    recipient = { id: c.igsid }
  }

  const message = toIgMessage(node, ctx.run.id, ctx.account.username)
  try {
    const res = await ig.sendMessage(ctx.token, ctx.account.ig_user_id, recipient, message)
    await db.query(
      `insert into messages (contact_id, direction, mid, kind, body, sent_by, run_id)
       values ($1, 'out', $2, $3, $4, 'bot', $5) on conflict do nothing`,
      [ctx.contact.id, res.message_id ?? null, node.private_reply ? "private_reply" : "template", JSON.stringify(message), ctx.run.id],
    )
    await db.query(`update contacts set last_message_at = now() where id = $1`, [ctx.contact.id])
    if (node.private_reply) {
      await db.query(`update comment_events set status = 'replied', private_reply_mid = $2 where id = $1`, [
        ctx.run.comment_event_id,
        res.message_id ?? null,
      ])
    }
    if (ctx.run.attempts) {
      await db.query(`update flow_runs set attempts = 0, error = null where id = $1`, [ctx.run.id])
      ctx.run.attempts = 0
    }
    if (node.step) await event(db, ctx.run, node.step)
    ctx.log?.("sent", { node: node.id, to: node.private_reply ? "comentario" : "dm", mid: res.message_id })
    return true
  } catch (e) {
    const err = e instanceof IgError ? { message: e.message, code: e.code, status: e.status } : { message: String(e) }
    // Meta limit, a brief outage or network: retried later instead of losing the person
    const attempts = ctx.run.attempts ?? 0
    if (isTransient(e) && attempts < RETRY_DELAYS_MIN.length) {
      const resumeAt = new Date(now.getTime() + RETRY_DELAYS_MIN[attempts] * 60_000)
      await db.query(
        `update flow_runs set status = 'waiting', waiting_for = 'time', resume_at = $2, attempts = attempts + 1,
         error = $3 where id = $1`,
        [ctx.run.id, resumeAt, JSON.stringify({ ...err, retry: attempts + 1 })],
      )
      ctx.log?.("send postponed", { run: ctx.run.id, node: node.id, retry: attempts + 1, at: resumeAt.toISOString(), error: err.message })
      return false
    }
    await db.query(
      `insert into messages (contact_id, direction, kind, body, sent_by, run_id, error) values ($1, 'out', $2, $3, 'bot', $4, $5)`,
      [ctx.contact.id, node.private_reply ? "private_reply" : "template", JSON.stringify(message), ctx.run.id, JSON.stringify(err)],
    )
    if (node.private_reply) {
      await db.query(`update comment_events set status = 'failed', error = $2 where id = $1`, [ctx.run.comment_event_id, JSON.stringify(err)])
    }
    if (e instanceof IgError && e.tokenInvalid) {
      await db.query(`update ig_accounts set status = 'expired' where id = $1`, [ctx.account.id])
    }
    await event(db, ctx.run, "failed")
    return fail(ctx, err.message)
  }
}

async function checkFollow(ctx: Ctx): Promise<boolean> {
  try {
    const p = await ctx.ig.getProfile(ctx.token, ctx.contact.igsid)
    const follows = Boolean(p.is_user_follow_business)
    await ctx.db.query(
      `update contacts set follows_business = $2, follows_checked_at = now(),
       username = coalesce($3, username), name = coalesce($4, name) where id = $1`,
      [ctx.contact.id, follows, p.username ?? null, p.name ?? null],
    )
    return follows
  } catch (e) {
    // when it cannot be checked, it is treated as "does not follow": the retry limit prevents a loop
    ctx.log?.("follow check failed", { contact: ctx.contact.id, error: String(e) })
    return false
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────

async function upsertContact(db: Db, accountId: string, igsid: string, username?: string, o: { inbound?: boolean } = {}) {
  const [c] = await db.query<Contact>(
    `insert into contacts (ig_account_id, igsid, username, opted_in, last_inbound_at)
     values ($1, $2, $3, $4, case when $4 then now() end)
     on conflict (ig_account_id, igsid) do update set
       username = coalesce(excluded.username, contacts.username),
       opted_in = contacts.opted_in or excluded.opted_in,
       last_inbound_at = case when $4 then now() else contacts.last_inbound_at end,
       last_message_at = case when $4 then now() else contacts.last_message_at end,
       unread_count = contacts.unread_count + case when $4 then 1 else 0 end,
       -- if they write in a closed inbox conversation, it opens again
       inbox_status = case when $4 then 'open' else contacts.inbox_status end
     returning id, igsid, last_inbound_at`,
    [accountId, igsid, username ?? null, Boolean(o.inbound)],
  )
  return c
}

async function event(db: Db, run: Run, step: string) {
  await db.query(`insert into automation_events (automation_id, contact_id, run_id, step) values ($1, $2, $3, $4)`, [
    run.automation_id,
    run.contact_id,
    run.id,
    step,
  ])
}

async function finish(db: Db, runId: string, status: "done" | "expired" | "failed", error?: string) {
  await db.query(
    `update flow_runs set status = $2, finished_at = now(), waiting_for = null, error = $3 where id = $1`,
    [runId, status, error ? JSON.stringify({ message: error }) : null],
  )
}

async function fail(ctx: Ctx, why: string): Promise<false> {
  ctx.log?.("run failed", { run: ctx.run.id, why })
  await finish(ctx.db, ctx.run.id, "failed", why)
  return false
}

async function expire(ctx: Ctx, why: string): Promise<false> {
  await finish(ctx.db, ctx.run.id, "expired", why)
  return false
}

/** Runs with a postponed send whose time has come: they resume at the same node. */
export async function resumeDueRuns(deps: EngineDeps, limit = 10): Promise<number> {
  const { db } = deps
  const now = (deps.now ?? (() => new Date()))()
  let n = 0
  for (; n < limit; n++) {
    const [run] = await db.query<Run>(
      `update flow_runs set status = 'running', waiting_for = null, resume_at = null
       where id = (select id from flow_runs where status = 'waiting' and waiting_for = 'time' and resume_at <= $1
                   order by resume_at limit 1 for update skip locked)
       returning *`,
      [now],
    )
    if (!run) break
    try {
      const [row] = await db.query<Account & { graph: Graph; contact_igsid: string; last_inbound_at: Date | null }>(
        `select a.id, a.ig_user_id, a.username, a.access_token_enc, a.status, v.graph,
                c.igsid as contact_igsid, c.last_inbound_at
         from contacts c join ig_accounts a on a.id = c.ig_account_id
         join automation_versions v on v.id = $2
         where c.id = $1`,
        [run.contact_id, run.version_id],
      )
      if (!row || row.status !== "ok") {
        await finish(db, run.id, "failed", "unknown or inactive account")
        continue
      }
      const account: Account = { id: row.id, ig_user_id: row.ig_user_id, username: row.username, access_token_enc: row.access_token_enc, status: row.status }
      const token = decrypt(account.access_token_enc, deps.encKey)
      const contact: Contact = { id: run.contact_id, igsid: row.contact_igsid, last_inbound_at: row.last_inbound_at }
      deps.log?.("retry", { run: run.id, node: run.current_node, attempt: run.attempts })
      await advance({ ...deps, account, token, graph: row.graph, contact, run }, run.current_node ?? row.graph.start, run.current_node)
      await publicReplyAfterRetry(deps, token, run)
    } catch (e) {
      deps.log?.("retry failed", { run: run.id, error: String(e) })
      await finish(db, run.id, "failed", String(e))
    }
  }
  return n
}

/** If the first DM went out on a retry, the pending public reply goes out now. */
async function publicReplyAfterRetry(deps: EngineDeps, token: string, run: Run) {
  if (!run.comment_event_id) return
  const [ce] = await deps.db.query<{ comment_id: string; status: string; public_reply_id: string | null; trigger_id: string | null }>(
    `select comment_id, status, public_reply_id, trigger_id from comment_events where id = $1`,
    [run.comment_event_id],
  )
  if (!ce || ce.status !== "replied" || ce.public_reply_id || !ce.trigger_id) return
  const [replied] = await deps.db.query(`select 1 from automation_events where run_id = $1 and step = 'public_replied'`, [run.id])
  if (replied) return
  const [trigger] = await deps.db.query<Trigger>(`select * from triggers where id = $1`, [ce.trigger_id])
  if (trigger) await publicReply(deps, token, run.comment_event_id, ce.comment_id, trigger, run)
}

/** Runs waiting for a button whose window has closed, every 10 minutes. */
export async function expireStaleRuns(db: Db): Promise<number> {
  const rows = await db.query(
    `update flow_runs r set status = 'expired', finished_at = now(), waiting_for = null,
       error = '{"message":"the window closed while waiting for a tap"}'
     from contacts c
     where c.id = r.contact_id and r.status = 'waiting' and r.waiting_for = 'button'
       and r.started_at < now() - interval '7 days'
       and (c.last_inbound_at is null or c.last_inbound_at < now() - interval '24 hours')
     returning r.id`,
  )
  return rows.length
}
