import Link from "next/link"
import { cn } from "@/lib/utils"
import { getT } from "@/server/i18n"

/** Automations tabs: your own, the templates and the sequences. */
export async function AutomationTabs({ current }: { current: string }) {
  const t = (await getT()).t.automations
  const TABS = [
    { href: "/automations", label: t.tabMine },
    { href: "/automations/plantillas", label: t.tabTemplates },
    { href: "/automations/secuencias", label: t.tabSequences, soon: true },
  ]
  return (
    <nav aria-label={t.tabsLabel} className="flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = tab.href === current
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 pt-1 pb-2.5 text-sm font-medium text-muted-foreground hover:text-foreground",
              active && "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-pill after:bg-primary",
            )}
          >
            {tab.label}
            {tab.soon && <span className="rounded-pill bg-muted px-1.5 py-px text-[0.625rem] font-semibold text-muted-foreground">{t.soon}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
