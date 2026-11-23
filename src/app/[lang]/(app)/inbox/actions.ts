"use server"

import { refresh } from "next/cache"
import { getDb } from "@/server/db"
import { decrypt } from "@/server/crypto"
import { env } from "@/server/env"
import { secrets } from "@/server/config"
import { httpInstagram, IgError } from "@/server/instagram"
import { getActionT } from "@/server/i18n"
import { requireUser } from "@/server/session"

const WINDOW_MS = 24 * 3600_000
const MAX_TEXT = 1000

type Owned = {
  id: string
  igsid: string
  username: string | null
  last_inbound_at: Date | null
  ig_user_id: string
  access_token_enc: Uint8Array
  account_status: string
}

/** The conversation, only if it belongs to an account of the logged-in user. */
async function owned(contactId: string): Promise<Owned> {
  const user = await requireUser()
  const db = await getDb()
  const [c] = await db.query<Owned>(
    `select c.id, c.igsid, c.username, c.last_inbound_at, acc.ig_user_id, acc.access_token_enc, acc.status account_status
     from contacts c join ig_accounts acc on acc.id = c.ig_account_id
     where c.id = $1 and acc.user_id = $2`,
    [contactId, user.id],
  )
  if (!c) throw new Error((await getActionT()).t.inbox.errNotFound)
  return c
}

export type ReplyResult = { ok: true } | { ok: false; error: string }

/** Replies by hand on Instagram. Only within 24 h of their last message, as Meta requires. */
export async function sendReply(contactId: string, text: string): Promise<ReplyResult> {
  const t = (await getActionT()).t.inbox
  const body = text.trim().slice(0, MAX_TEXT)
  if (!body) return { ok: false, error: t.errEmpty }
  const c = await owned(contactId)
  if (!c.last_inbound_at || Date.now() - c.last_inbound_at.getTime() > WINDOW_MS) {
    return { ok: false, error: t.errWindow }
  }
  if (c.account_status !== "ok") return { ok: false, error: t.errDisconnected }
  const db = await getDb()
  const message = { text: body }
  try {
    const ig = httpInstagram(env.apiVersion())
    const res = await ig.sendMessage(decrypt(c.access_token_enc, await secrets.tokenEncKey()), c.ig_user_id, { id: c.igsid }, message)
    await db.query(
      `insert into messages (contact_id, direction, mid, kind, body, sent_by) values ($1, 'out', $2, 'text', $3, 'human')
       on conflict do nothing`,
      [c.id, res.message_id ?? null, JSON.stringify(message)],
    )
    await db.query(`update contacts set last_message_at = now(), unread_count = 0 where id = $1`, [c.id])
    refresh()
    return { ok: true }
  } catch (e) {
    const error = e instanceof IgError ? e.message : t.errNoAnswer
    await db.query(
      `insert into messages (contact_id, direction, kind, body, sent_by, error) values ($1, 'out', 'text', $2, 'human', $3)`,
      [c.id, JSON.stringify(message), JSON.stringify({ message: error })],
    )
    refresh()
    return { ok: false, error }
  }
}

/** Internal note: only you see it, it is never sent. */
export async function addNote(contactId: string, text: string): Promise<ReplyResult> {
  const body = text.trim().slice(0, MAX_TEXT)
  if (!body) return { ok: false, error: (await getActionT()).t.inbox.errEmptyNote }
  const c = await owned(contactId)
  await (await getDb()).query(`insert into messages (contact_id, direction, kind, body, sent_by) values ($1, 'out', 'note', $2, 'human')`, [
    c.id,
    JSON.stringify({ text: body }),
  ])
  refresh()
  return { ok: true }
}

/** Marks the conversation as read and, if we do not know who it is yet, fetches their name and photo. */
export async function markRead(contactId: string) {
  const c = await owned(contactId)
  const db = await getDb()
  await db.query(`update contacts set unread_count = 0 where id = $1`, [c.id])
  if (!c.username && c.account_status === "ok") {
    try {
      const p = await contactProfile(decrypt(c.access_token_enc, await secrets.tokenEncKey()), c.igsid)
      await db.query(
        `update contacts set username = coalesce($2, username), name = coalesce($3, name),
         profile_pic_url = coalesce($4, profile_pic_url) where id = $1`,
        [c.id, p.username ?? null, p.name ?? null, p.profile_pic ?? null],
      )
    } catch {
      // no permission or no answer: it stays without a name, not a big deal
    }
  }
  refresh()
}

async function contactProfile(token: string, igsid: string) {
  const url = new URL(`https://graph.instagram.com/${env.apiVersion()}/${encodeURIComponent(igsid)}`)
  url.searchParams.set("fields", "username,name,profile_pic")
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as { username?: string; name?: string; profile_pic?: string }
}

export async function setConversationStatus(contactId: string, status: "open" | "closed") {
  const c = await owned(contactId)
  await (await getDb()).query(`update contacts set inbox_status = $2 where id = $1`, [c.id, status])
  refresh()
}

export async function toggleStar(contactId: string) {
  const c = await owned(contactId)
  await (await getDb()).query(`update contacts set starred = not starred where id = $1`, [c.id])
  refresh()
}

/** Reminder to come back to the conversation: in hours from now, or null to remove it. */
export async function setReminder(contactId: string, hours: number | null) {
  const c = await owned(contactId)
  const at = hours ? new Date(Date.now() + Math.min(Math.max(hours, 1), 24 * 30) * 3600_000) : null
  await (await getDb()).query(`update contacts set remind_at = $2 where id = $1`, [c.id, at])
  refresh()
}
