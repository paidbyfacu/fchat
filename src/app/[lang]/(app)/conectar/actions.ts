"use server"

import { refresh } from "next/cache"
import { igApp, saveIgApp } from "@/server/config"
import { getActionT } from "@/server/i18n"
import { requireUser } from "@/server/session"

export type IgAppState = { ok?: boolean; error?: string; field?: "appId" | "appSecret" }

/** Saves the Instagram app ID and app secret that each person creates in Meta. */
export async function saveIgAppAction(_prev: IgAppState, form: FormData): Promise<IgAppState> {
  await requireUser()
  const t = (await getActionT()).t.conectar
  const appId = String(form.get("appId") ?? "").replace(/\s/g, "").slice(0, 40)
  const appSecret = String(form.get("appSecret") ?? "").replace(/\s/g, "").slice(0, 80)
  const current = await igApp().catch(() => null)
  if (current?.source === "env") {
    return { error: t.errEnv }
  }
  if (!/^\d{8,25}$/.test(appId)) {
    return { error: t.errAppId, field: "appId" }
  }
  if (!/^[A-Za-z0-9]{20,64}$/.test(appSecret)) {
    return { error: t.errAppSecret, field: "appSecret" }
  }
  await saveIgApp(appId, appSecret)
  refresh()
  return { ok: true }
}
