"use server"

import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { decrypt } from "@/server/crypto"
import { env } from "@/server/env"
import { secrets } from "@/server/config"
import { httpInstagram } from "@/server/instagram"
import { getActionT } from "@/server/i18n"
import { destroySession, requireUser, revokeSessions } from "@/server/session"

export async function setAutomationStatus(automationId: string, status: "live" | "stopped") {
  const user = await requireUser()
  const db = await getDb()
  await db.tx(async (q) => {
    const [a] = await q.query<{ id: string }>(
      `update automations a set status = $3
       from ig_accounts acc
       where a.id = $2 and acc.id = a.ig_account_id and acc.user_id = $1 and a.live_version_id is not null
       returning a.id`,
      [user.id, automationId, status],
    )
    if (!a) throw new Error((await getActionT()).t.common.notFound)
    await q.query(
      `update triggers set is_active = $2,
         armed_at = case when $2 and post_scope = 'next' and media_id is null then now() else armed_at end
       where automation_id = $1`,
      [automationId, status === "live"],
    )
  })
  refresh()
}

export async function resubscribeWebhooks(accountId: string) {
  const user = await requireUser()
  const db = await getDb()
  const [acc] = await db.query<{ ig_user_id: string; access_token_enc: Uint8Array }>(
    `select ig_user_id, access_token_enc from ig_accounts where id = $1 and user_id = $2`,
    [accountId, user.id],
  )
  if (!acc) throw new Error((await getActionT()).t.common.accountNotFound)
  const ig = httpInstagram(env.apiVersion())
  await ig.subscribe(decrypt(acc.access_token_enc, await secrets.tokenEncKey()), acc.ig_user_id, ["comments", "messages", "messaging_postbacks"])
  await db.query(`update ig_accounts set webhooks_subscribed = true where id = $1`, [accountId])
  refresh()
}

export async function logout() {
  await destroySession()
  redirect("/login")
}

/** Closes a session from the Settings › Security list. Only the user's own sessions. */
export async function revokeSessionAction(sessionId: string) {
  const user = await requireUser()
  if (sessionId === user.sessionId) return logout()
  await (await getDb()).query(`update sessions set revoked_at = now() where id = $1 and user_id = $2 and revoked_at is null`, [
    sessionId,
    user.id,
  ])
  refresh()
}

/** Keeps open only the session the request comes from. */
export async function revokeOtherSessionsAction() {
  const user = await requireUser()
  await revokeSessions(user.id, user.sessionId)
  refresh()
}
