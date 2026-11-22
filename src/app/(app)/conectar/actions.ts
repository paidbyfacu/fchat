"use server"

import { refresh } from "next/cache"
import { igApp, saveIgApp } from "@/server/config"
import { requireUser } from "@/server/session"

export type IgAppState = { ok?: boolean; error?: string; field?: "appId" | "appSecret" }

/** Guarda el identificador y la clave secreta de la app de Instagram que cada uno crea en Meta. */
export async function saveIgAppAction(_prev: IgAppState, form: FormData): Promise<IgAppState> {
  await requireUser()
  const appId = String(form.get("appId") ?? "").replace(/\s/g, "").slice(0, 40)
  const appSecret = String(form.get("appSecret") ?? "").replace(/\s/g, "").slice(0, 80)
  const current = await igApp().catch(() => null)
  if (current?.source === "env") {
    return { error: "Tu servidor ya tiene IG_APP_ID e IG_APP_SECRET en sus variables, y esas mandan. Cámbialas allí." }
  }
  if (!/^\d{8,25}$/.test(appId)) {
    return { error: "El identificador son solo números. Cópialo de «Identificador de la app de Instagram».", field: "appId" }
  }
  if (!/^[A-Za-z0-9]{20,64}$/.test(appSecret)) {
    return {
      error: "La clave secreta tiene unas 32 letras y números. En Meta toca «Mostrar» y cópiala entera.",
      field: "appSecret",
    }
  }
  await saveIgApp(appId, appSecret)
  refresh()
  return { ok: true }
}
