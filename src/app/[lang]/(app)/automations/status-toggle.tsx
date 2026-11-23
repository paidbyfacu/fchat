"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"
import { setAutomationStatus } from "../actions"

export function StatusToggle({ id, name, status }: { id: string; name: string; status: "draft" | "live" | "stopped" }) {
  const [pending, start] = useTransition()
  const live = status === "live"
  const t = useT().t.automations
  return (
    <Button
      size="sm"
      variant={live ? "outline" : "default"}
      loading={pending}
      aria-label={fmt(live ? t.stopNamed : t.startNamed, { name })}
      onClick={() =>
        start(async () => {
          try {
            await setAutomationStatus(id, live ? "stopped" : "live")
            toast.success(live ? t.stopped : t.nowLive)
          } catch {
            toast.error(t.statusError)
          }
        })
      }
    >
      {live ? t.stop : t.start}
    </Button>
  )
}
