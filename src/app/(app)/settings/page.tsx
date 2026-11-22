import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRightIcon, AtSignIcon, ShieldCheckIcon, TagIcon } from "lucide-react"
import { Page, PageHeader } from "@/components/mc/page-header"

export const metadata: Metadata = { title: "Ajustes" }

const ITEMS = [
  { href: "/settings/instagram", icon: AtSignIcon, title: "Instagram", text: "Cuentas conectadas, acceso y webhooks", ready: true },
  { href: "/settings/security", icon: ShieldCheckIcon, title: "Seguridad", text: "Dónde está abierto el panel y cerrar sesiones", ready: true },
  { href: "#", icon: TagIcon, title: "Etiquetas y campos", text: "Llega en el hito 3", ready: false },
]

export default function SettingsPage() {
  return (
    <Page>
      <PageHeader title="Ajustes" />
      <ul className="grid gap-2 md:max-w-xl">
        {ITEMS.map((i) => (
          <li key={i.title}>
            {i.ready ? (
              <Link href={i.href} className="flex items-center gap-3 rounded-md bg-card p-4 shadow-card hover:bg-muted">
                <i.icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="grid flex-1">
                  <span className="font-medium">{i.title}</span>
                  <span className="text-xs text-muted-foreground">{i.text}</span>
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-md bg-card p-4 opacity-60 shadow-card" aria-disabled="true">
                <i.icon className="size-5 text-muted-foreground" aria-hidden />
                <span className="grid flex-1">
                  <span className="font-medium">{i.title}</span>
                  <span className="text-xs text-muted-foreground">{i.text}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Page>
  )
}
