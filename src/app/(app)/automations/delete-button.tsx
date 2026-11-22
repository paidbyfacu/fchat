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
import { deleteAutomationAction } from "./wizard-actions"

export function DeleteAutomationButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition()
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" />}>
        <Trash2Icon /> Eliminar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar «{name}»?</DialogTitle>
          <DialogDescription>
            Deja de responder al instante y se borran sus versiones y sus métricas. Los contactos y los mensajes quedan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" loading={pending} onClick={() => start(() => deleteAutomationAction(id))}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
