import { cn } from "@/lib/utils"

/** Marca: globo de chat con un rayo (respuesta automática), sobre el naranja de marca. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="var(--tk-brand)" />
      <path
        d="M9 9.5h14a2.5 2.5 0 0 1 2.5 2.5v7.5A2.5 2.5 0 0 1 23 22h-7.2l-4.6 3.6c-.5.4-1.2 0-1.2-.6V22H9a2.5 2.5 0 0 1-2.5-2.5V12A2.5 2.5 0 0 1 9 9.5Z"
        fill="#fff"
      />
      <path d="M17.2 11.8 12.6 17h3.3l-1.1 3.4 4.6-5.3h-3.3l1.1-3.3Z" fill="var(--tk-brand)" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("grid min-w-0 leading-tight", compact && "flex items-baseline gap-1.5")}>
        <span className="truncate text-sm font-bold tracking-tight">FChat</span>
        <span className="truncate text-xs text-muted-foreground">by paidbyfacu</span>
      </span>
    </span>
  )
}
