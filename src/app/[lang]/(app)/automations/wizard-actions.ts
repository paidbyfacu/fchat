"use server"

import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { deleteAutomation, saveAutomation, type SaveResult } from "@/server/automations"
import { requireUser } from "@/server/session"
import { requestLocale } from "@/server/i18n"
import type { Wizard } from "@/lib/wizard"

export async function saveWizardAction(id: string | null, wizard: Wizard, publish: boolean): Promise<SaveResult> {
  const [user, locale] = await Promise.all([requireUser(), requestLocale()])
  return saveAutomation(await getDb(), user.id, id, wizard, publish, locale)
}

export async function deleteAutomationAction(id: string) {
  const user = await requireUser()
  await deleteAutomation(await getDb(), user.id, id)
  redirect("/automations")
}
