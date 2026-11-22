// Guardar, publicar y borrar automatizaciones creadas con el asistente.
// Publicar = versión nueva del grafo + trigger nuevo; los runs en curso
// terminan con la versión con la que empezaron.

import type { Db } from "./db"
import { validateWizard, type Wizard, type WizardIssue } from "@/lib/wizard"
import { compileWizard, wizardFromGraph } from "./engine/compile"
import type { Graph } from "./engine/graph"

export type SaveResult =
  | { ok: true; id: string; warnings: string[] }
  | { ok: false; issues: WizardIssue[] }

const isUnique = (e: unknown, name: string) => (e as { code?: string; constraint?: string; message?: string })?.code === "23505" && String((e as { message?: string }).message ?? "").includes(name)

export async function saveAutomation(db: Db, userId: string, id: string | null, w: Wizard, publish: boolean): Promise<SaveResult> {
  const issues = publish ? validateWizard(w) : validateWizard(w).filter((i) => i.field === "name" || i.field === "accountId")
  if (issues.length) return { ok: false, issues }

  const [acc] = await db.query(`select id from ig_accounts where id = $1 and user_id = $2`, [w.accountId, userId])
  if (!acc) return { ok: false, issues: [{ field: "accountId", message: "Esa cuenta no es tuya o ya no está conectada." }] }

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
        const { graph, trigger } = compileWizard(w)
        const [{ v }] = await q.query<{ v: number }>(`select coalesce(max(version), 0) + 1 v from automation_versions where automation_id = $1`, [aid])
        const [ver] = await q.query<{ id: string }>(
          `insert into automation_versions (automation_id, version, graph) values ($1, $2, $3) returning id`,
          [aid, v, JSON.stringify(graph)],
        )
        await q.query(`update automations set live_version_id = $2, status = 'live' where id = $1`, [aid, ver.id])
        // si sigue esperando el "próximo post" sin cambios de alcance, se conserva el post ya asignado
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
    return { ok: true, id: savedId, warnings: publish ? await conflicts(db, savedId) : [] }
  } catch (e) {
    if ((e as Error).message === "NOT_FOUND") return { ok: false, issues: [{ field: "name", message: "No encontré esa automatización." }] }
    if (isUnique(e, "one_armed_next_post")) {
      return {
        ok: false,
        issues: [{ field: "posts", message: "Ya hay otra automatización activa esperando el próximo post. Solo puede haber una a la vez." }],
      }
    }
    throw e
  }
}

/** Otras automatizaciones activas de la misma cuenta que pueden responder el mismo comentario. */
async function conflicts(db: Db, id: string): Promise<string[]> {
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
        ? `«${r.name}» también responde a ${r.shared.map((k) => `«${k}»`).join(", ")}. Gana la que tiene palabras y, entre esas, la más vieja.`
        : `«${r.name}» responde a cualquier comentario en algunos de los mismos posts. La que tiene palabras va primero.`,
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

/** El estado del asistente para editar: el guardado, o reconstruido desde el grafo. */
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
