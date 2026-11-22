"use server"

import { redirect } from "next/navigation"
import { getDb } from "@/server/db"
import { deleteAutomation, saveAutomation, type SaveResult } from "@/server/automations"
import { requireUser } from "@/server/session"
import type { Wizard } from "@/lib/wizard"

export async function saveWizardAction(id: string | null, wizard: Wizard, publish: boolean): Promise<SaveResult> {
  const user = await requireUser()
  return saveAutomation(await getDb(), user.id, id, wizard, publish)
}

export async function deleteAutomationAction(id: string) {
  const user = await requireUser()
  await deleteAutomation(await getDb(), user.id, id)
  redirect("/automations")
}
