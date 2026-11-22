"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { setAutomationStatus } from "../actions"

export function StatusToggle({ id, name, status }: { id: string; name: string; status: "draft" | "live" | "stopped" }) {
  const [pending, start] = useTransition()
  const live = status === "live"
  return (
    <Button
      size="sm"
      variant={live ? "outline" : "default"}
      loading={pending}
      aria-label={live ? `Detener «${name}»` : `Activar «${name}»`}
      onClick={() =>
        start(async () => {
          try {
            await setAutomationStatus(id, live ? "stopped" : "live")
            toast.success(live ? "Automatización detenida" : "Automatización activa: ya responde comentarios")
          } catch {
            toast.error("No se pudo cambiar el estado. Prueba de nuevo.")
          }
        })
      }
    >
      {live ? "Detener" : "Activar"}
    </Button>
  )
}
