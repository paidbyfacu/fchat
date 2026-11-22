import { cn } from "@/lib/utils"

export type Status = "live" | "draft" | "stopped" | "error" | "new"

const STYLES: Record<Status, { label: string; className: string; dot: string }> = {
  live: { label: "Activa", className: "bg-success-subtle text-success", dot: "bg-success" },
  draft: { label: "Borrador", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  stopped: { label: "Detenida", className: "bg-warning-subtle text-warning", dot: "bg-warning" },
  error: { label: "Con error", className: "bg-danger-subtle text-destructive", dot: "bg-destructive" },
  new: { label: "Nuevo", className: "bg-highlight text-on-highlight", dot: "bg-on-highlight" },
}

/** El texto siempre dice el estado: el color nunca es la única señal. */
export function StatusBadge({ status, label, className }: { status: Status; label?: string; className?: string }) {
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
      {label ?? s.label}
    </span>
  )
}
