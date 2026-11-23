"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n"
import { revokeOtherSessionsAction, revokeSessionAction } from "../../actions"

export function RevokeSessionButton({ sessionId, current }: { sessionId: string; current: boolean }) {
  const { t } = useT()
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
            if (!current) toast.success(t.settings.sessionClosed)
          } catch {
            toast.error(t.settings.sessionCloseError)
          }
        })
      }
    >
      {current ? t.settings.sessionLogout : t.settings.sessionClose}
    </Button>
  )
}

export function RevokeOthersButton() {
  const { t } = useT()
  const [pending, start] = useTransition()
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          try {
            await revokeOtherSessionsAction()
            toast.success(t.settings.othersClosed)
          } catch {
            toast.error(t.settings.othersCloseError)
          }
        })
      }
    >
      {t.settings.closeOthers}
    </Button>
  )
}
