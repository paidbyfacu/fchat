"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { resubscribeWebhooks } from "../../actions"

export function ResubscribeButton({ accountId, username }: { accountId: string; username: string }) {
  const [pending, start] = useTransition()
  return (
    <Button
      size="sm"
      variant="outline"
      loading={pending}
      aria-label={`Volver a activar los webhooks de @${username}`}
      onClick={() =>
        start(async () => {
          try {
            await resubscribeWebhooks(accountId)
            toast.success("Webhooks activos: los comentarios van a llegar")
          } catch {
            toast.error("Meta no aceptó la suscripción. Prueba reconectar la cuenta.")
          }
        })
      }
    >
      Reactivar webhooks
    </Button>
  )
}
