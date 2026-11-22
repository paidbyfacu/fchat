import { cn } from "@/lib/utils"

/** Fondo animado de FChat. El contenedor que lo envuelve necesita relative e isolate. */
export function Aurora({ strong = false, className }: { strong?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("fc-aurora", strong && "fc-aurora-strong", className)}>
      <span />
      <span />
      <span />
    </div>
  )
}
