"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { revokeOtherSessionsAction, revokeSessionAction } from "../../actions"

export function RevokeSessionButton({ sessionId, current }: { sessionId: string; current: boolean }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant={current ? "ghost" : "outline"}
      loading={pending}
      onClick={() =>
        start(async () => {
          try {
            await revokeSessionAction(sessionId)
            if (!current) toast.success("Sesión cerrada")
          } catch {
            toast.error("No se pudo cerrar la sesión. Prueba de nuevo.")
          }
        })
      }
    >
      {current ? "Salir" : "Cerrar"}
    </Button>
  )
}

export function RevokeOthersButton() {
  const [pending, start] = useTransition()
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          try {
            await revokeOtherSessionsAction()
            toast.success("Listo: el panel solo queda abierto aquí")
          } catch {
            toast.error("No se pudieron cerrar las sesiones. Prueba de nuevo.")
          }
        })
      }
    >
      Cerrar todas las demás
    </Button>
  )
}
