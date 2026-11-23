import { cn } from "@/lib/utils"
import { getMessages } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/locale"

export type Status = "live" | "draft" | "stopped" | "error" | "new"

const STYLES: Record<Status, { className: string; dot: string }> = {
  live: { className: "bg-success-subtle text-success", dot: "bg-success" },
  draft: { className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  stopped: { className: "bg-warning-subtle text-warning", dot: "bg-warning" },
  error: { className: "bg-danger-subtle text-destructive", dot: "bg-destructive" },
  new: { className: "bg-highlight text-on-highlight", dot: "bg-on-highlight" },
}

const LABEL = {
  live: "statusLive",
  draft: "statusDraft",
  stopped: "statusStopped",
  error: "statusError",
  new: "statusNew",
} as const

/** The text always states the status: color is never the only signal. */
export function StatusBadge({
  status,
  label,
  locale = "es",
  className,
}: {
  status: Status
  label?: string
  locale?: Locale
  className?: string
}) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-pill px-2 text-xs font-medium whitespace-nowrap",
        s.className,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {label ?? getMessages(locale).ui[LABEL[status]]}
    </span>
  )
}
