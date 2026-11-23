// Save, publish and delete automations made with the wizard.
// Publishing = new graph version + new trigger; runs in progress
// finish with the version they started with.

import type { Db } from "./db"
import { validateWizard, type Wizard, type WizardIssue } from "@/lib/wizard"
import { fmt, quote, type Locale } from "@/lib/i18n/locale"
import { getMessages } from "@/lib/i18n"
import { compileWizard, wizardFromGraph } from "./engine/compile"
import type { Graph } from "./engine/graph"

export type SaveResult =
  | { ok: true; id: string; warnings: string[] }
  | { ok: false; issues: WizardIssue[] }

const isUnique = (e: unknown, name: string) => (e as { code?: string; constraint?: string; message?: string })?.code === "23505" && String((e as { message?: string }).message ?? "").includes(name)

export async function saveAutomation(db: Db, userId: string, id: string | null, w: Wizard, publish: boolean, locale: Locale = "es"): Promise<SaveResult> {
  const t = getMessages(locale).wizard
  const issues = publish ? validateWizard(w, locale) : validateWizard(w, locale).filter((i) => i.field === "name" || i.field === "accountId")
  if (issues.length) return { ok: false, issues }

  const [acc] = await db.query(`select id from ig_accounts where id = $1 and user_id = $2`, [w.accountId, userId])
  if (!acc) return { ok: false, issues: [{ field: "accountId", message: t.errNotYours }] }

  try {
    const savedId = await db.tx(async (q) => {
      let aid = id
      if (aid) {
        const [own] = await q.query(
          `update automations a set name = $3, wizard = $4, ig_account_id = $5
           from ig_accounts acc where a.id = $2 and acc.id = a.ig_account_id and acc.user_id = $1 returning a.id`,
          [userId, aid, w.name.trim(), JSON.stringify(w), w.accountId],
        )
        if (!own) throw new Error("NOT_FOUND")
      } else {
        const [a] = await q.query<{ id: string }>(
          `insert into automations (ig_account_id, name, kind, template, status, wizard)
           values ($1, $2, 'quick', 'comment_dm', 'draft', $3) returning id`,
          [w.accountId, w.name.trim(), JSON.stringify(w)],
        )
        aid = a.id
      }
      if (publish) {
        const { graph, trigger } = compileWizard(w, locale)
        const [{ v }] = await q.query<{ v: number }>(`select coalesce(max(version), 0) + 1 v from automation_versions where automation_id = $1`, [aid])
        const [ver] = await q.query<{ id: string }>(
          `insert into automation_versions (automation_id, version, graph) values ($1, $2, $3) returning id`,
          [aid, v, JSON.stringify(graph)],
        )
        await q.query(`update automations set live_version_id = $2, status = 'live' where id = $1`, [aid, ver.id])
        // still waiting for the "next post" with the same scope: keep the post already assigned
        const [prev] = await q.query<{ post_scope: string; media_id: string | null; armed_at: Date | null }>(
          `select post_scope, media_id, armed_at from triggers where automation_id = $1 order by created_at limit 1`,
          [aid],
        )
        await q.query(`delete from triggers where automation_id = $1`, [aid])
        const keepNext = trigger.post_scope === "next" && prev?.post_scope === "next"
        await q.query(
          `insert into triggers (automation_id, ig_account_id, type, post_scope, media_id, media_ids, keywords_include,
             keywords_exclude, match, public_replies, is_active, armed_at)
           values ($1, $2, 'comment', $3, $4, $5, $6, $7, $8, $9, true, $10)`,
          [
            aid,
            w.accountId,
            trigger.post_scope,
            keepNext ? prev.media_id : null,
            trigger.media_ids,
            trigger.keywords_include,
            trigger.keywords_exclude,
            trigger.match,
            trigger.public_replies,
            trigger.post_scope === "next" ? (keepNext && prev.armed_at ? prev.armed_at : new Date()) : null,
          ],
        )
      }
      return aid!
    })
    return { ok: true, id: savedId, warnings: publish ? await conflicts(db, savedId, locale) : [] }
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") return { ok: false, issues: [{ field: "name", message: t.errNotFound }] }
    if (isUnique(e, "one_armed_next_post")) {
      return {
        ok: false,
        issues: [{ field: "posts", message: t.errNextTaken }],
      }
    }
    throw e
  }
}

/** Other active automations of the same account that may reply to the same comment. */
async function conflicts(db: Db, id: string, locale: Locale): Promise<string[]> {
  const t = getMessages(locale).wizard
  const rows = await db.query<{ name: string; shared: string[]; any_match: boolean }>(
    `select a2.name,
       array(select unnest(t1.keywords_include) intersect select unnest(t2.keywords_include)) shared,
       (t1.match = 'any' or t2.match = 'any') any_match
     from triggers t1
     join triggers t2 on t2.ig_account_id = t1.ig_account_id and t2.automation_id <> t1.automation_id and t2.is_active
     join automations a2 on a2.id = t2.automation_id
     where t1.automation_id = $1
       and (t1.post_scope <> 'specific' or t2.post_scope <> 'specific' or t1.media_ids && t2.media_ids)`,
    [id],
  )
  return rows
    .filter((r) => r.any_match || r.shared.length)
    .map((r) =>
      r.shared.length
        ? fmt(t.warnShared, { name: r.name, words: r.shared.map((k) => quote(locale, k)).join(", ") })
        : fmt(t.warnAny, { name: r.name }),
    )
}

export async function deleteAutomation(db: Db, userId: string, id: string): Promise<boolean> {
  const rows = await db.query(
    `delete from automations a using ig_accounts acc
     where a.id = $2 and acc.id = a.ig_account_id and acc.user_id = $1 returning a.id`,
    [userId, id],
  )
  return rows.length > 0
}

/** The wizard state for editing: the saved one, or rebuilt from the graph. */
export async function loadWizard(db: Db, userId: string, id: string): Promise<{ wizard: Wizard; status: string } | null> {
  const [a] = await db.query<{
    name: string
    ig_account_id: string
    status: string
    wizard: Partial<Wizard>
    graph: Graph | null
    post_scope: string | null
    media_ids: string[] | null
    keywords_include: string[] | null
    keywords_exclude: string[] | null
    public_replies: string[] | null
  }>(
    `select a.name, a.ig_account_id, a.status, a.wizard, v.graph,
       t.post_scope, t.media_ids, t.keywords_include, t.keywords_exclude, t.public_replies
     from automations a
     join ig_accounts acc on acc.id = a.ig_account_id
     left join automation_versions v on v.id = a.live_version_id
     left join lateral (select * from triggers where automation_id = a.id order by created_at limit 1) t on true
     where a.id = $2 and acc.user_id = $1`,
    [userId, id],
  )
  if (!a) return null
  const saved = a.wizard && "opening" in a.wizard ? (a.wizard as Wizard) : null
  const wizard =
    saved ?? wizardFromGraph({ name: a.name, accountId: a.ig_account_id }, a.graph, a.post_scope ? a : null)
  return { wizard: { ...wizard, accountId: a.ig_account_id }, status: a.status }
}
