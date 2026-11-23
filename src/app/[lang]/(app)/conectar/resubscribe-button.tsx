"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"
import { resubscribeWebhooks } from "../actions"

export function ResubscribeButton({ accountId, username }: { accountId: string; username: string }) {
  const [pending, start] = useTransition()
  const t = useT().t.conectar
  return (
    <Button
      size="sm"
      variant="outline"
      loading={pending}
      aria-label={fmt(t.resubscribeLabel, { username })}
      onClick={() =>
        start(async () => {
          try {
            await resubscribeWebhooks(accountId)
            toast.success(t.resubscribed)
          } catch {
            toast.error(t.resubscribeFailed)
          }
        })
      }
    >
      {t.resubscribe}
    </Button>
  )
}
