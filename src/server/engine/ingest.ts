// From a Meta webhook body to webhook_events rows, each with its deduplication
// key. Meta retries: the same key twice = one row.

import type { Db } from "../db"

export type IngestItem = { dedupe_key: string; ig_user_id: string; field: string; payload: unknown }

type Entry = {
  id?: string
  time?: number
  changes?: { field?: string; value?: { id?: string } }[]
  messaging?: {
    sender?: { id?: string }
    recipient?: { id?: string }
    timestamp?: number
    message?: { mid?: string; is_echo?: boolean }
    postback?: { mid?: string; payload?: string }
    read?: unknown
  }[]
}

export function toIngestItems(body: unknown): IngestItem[] {
  const entries = ((body as { entry?: Entry[] })?.entry ?? []) as Entry[]
  const items: IngestItem[] = []
  for (const e of entries) {
    const ig = String(e.id ?? "")
    if (!ig) continue
    for (const c of e.changes ?? []) {
      if (c.field === "comments" && c.value?.id) {
        items.push({ dedupe_key: `comment:${c.value.id}`, ig_user_id: ig, field: "comments", payload: c.value })
      }
    }
    for (const m of e.messaging ?? []) {
      // "read" events and echoes of our own sends are not stored
      if (m.read || m.message?.is_echo) continue
      if (m.postback) {
        const key = m.postback.mid ?? `${m.sender?.id}:${m.timestamp}:${m.postback.payload}`
        items.push({ dedupe_key: `postback:${key}`, ig_user_id: ig, field: "messaging_postbacks", payload: m })
      } else if (m.message?.mid) {
        items.push({ dedupe_key: `mid:${m.message.mid}`, ig_user_id: ig, field: "messages", payload: m })
      }
    }
  }
  return items
}

/** Stores what is new and returns how many rows were inserted; repeated ones are ignored. */
export async function ingest(db: Db, items: IngestItem[]): Promise<number> {
  let inserted = 0
  for (const it of items) {
    const rows = await db.query(
      `insert into webhook_events (dedupe_key, ig_user_id, field, payload)
       values ($1, $2, $3, $4) on conflict (dedupe_key) do nothing returning id`,
      [it.dedupe_key, it.ig_user_id, it.field, JSON.stringify(it.payload)],
    )
    inserted += rows.length
  }
  return inserted
}
