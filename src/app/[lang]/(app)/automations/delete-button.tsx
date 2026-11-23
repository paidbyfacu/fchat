"use client"

import { useTransition } from "react"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"
import { deleteAutomationAction } from "./wizard-actions"

export function DeleteAutomationButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition()
  const { t } = useT()
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" />}>
        <Trash2Icon /> {t.common.delete}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fmt(t.automations.deleteTitle, { name })}</DialogTitle>
          <DialogDescription>
            {t.automations.deleteText}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t.common.cancel}</DialogClose>
          <Button variant="destructive" loading={pending} onClick={() => start(() => deleteAutomationAction(id))}>
            {t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
