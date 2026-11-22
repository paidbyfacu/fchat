import type { ComponentType, ReactNode } from "react"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const BANNER = {
  info: { icon: InfoIcon, className: "bg-muted text-foreground", role: "status" },
  success: { icon: CircleCheckIcon, className: "bg-success-subtle text-success", role: "status" },
  warning: { icon: TriangleAlertIcon, className: "bg-warning-subtle text-warning", role: "status" },
  danger: { icon: OctagonXIcon, className: "bg-danger-subtle text-destructive", role: "alert" },
} as const

export function Banner({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof BANNER
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const b = BANNER[tone]
  const Icon = b.icon
  return (
    <div role={b.role} className={cn("flex items-start gap-3 rounded-md px-4 py-3", b.className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="grid flex-1 gap-0.5">
        <p className="text-sm font-semibold">{title}</p>
        {children && <div className="text-sm text-foreground">{children}</div>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-md bg-card px-6 py-12 text-center shadow-card">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-lg">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
