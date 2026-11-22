import Link from "next/link"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/automations", label: "Mis automatizaciones" },
  { href: "/automations/plantillas", label: "Plantillas" },
  { href: "/automations/secuencias", label: "Secuencias", soon: true },
]

/** Pestañas de Automatizaciones: las propias, las plantillas y las secuencias. */
export function AutomationTabs({ current }: { current: string }) {
  return (
    <nav aria-label="Secciones de automatizaciones" className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((t) => {
        const active = t.href === current
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 pt-1 pb-2.5 text-sm font-medium text-muted-foreground hover:text-foreground",
              active && "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-pill after:bg-primary",
            )}
          >
            {t.label}
            {t.soon && <span className="rounded-pill bg-muted px-1.5 py-px text-[0.625rem] font-semibold text-muted-foreground">Pronto</span>}
          </Link>
        )
      })}
    </nav>
  )
}
