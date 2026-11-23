import { cn } from "@/lib/utils"

/** FChat animated background. Its container needs relative and isolate. */
export function Aurora({ strong = false, className }: { strong?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("fc-aurora", strong && "fc-aurora-strong", className)}>
      <span />
      <span />
      <span />
    </div>
  )
}
