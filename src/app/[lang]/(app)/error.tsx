"use client"

import Link from "next/link"
import { AlertTriangleIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"

// If a dashboard page fails on the server, this shows inside the usual menu,
// in the dashboard's language, instead of Next's generic screen.
export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useT()
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : ""
  return (
    <div className="grid min-h-[60svh] place-items-center p-6">
      <div className="grid max-w-md justify-items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
          <AlertTriangleIcon className="size-6" />
        </span>
        <h1 className="text-xl">{t.common.errorTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.common.errorText}</p>
        {digest && <p className="font-mono text-xs text-muted-foreground">{fmt(t.common.errorCode, { digest })}</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button onClick={() => retry()}>{t.common.retry}</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            {t.common.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
