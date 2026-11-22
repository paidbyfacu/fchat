import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRightIcon, FileTextIcon, RefreshCwIcon, Share2Icon, ShieldCheckIcon, TagIcon } from "lucide-react"
import { Page, PageHeader } from "@/components/mc/page-header"

export const metadata: Metadata = { title: "Ajustes" }

const ITEMS = [
  { href: "/conectar", icon: Share2Icon, title: "Redes conectadas", text: "Tu Instagram, la guía de Meta y TikTok", ready: true },
  { href: "/settings/security", icon: ShieldCheckIcon, title: "Seguridad", text: "Contraseña y sesiones abiertas", ready: true },
  { href: "/settings/actualizaciones", icon: RefreshCwIcon, title: "Actualizaciones", text: "Tu versión y las actualizaciones automáticas", ready: true },
  { href: "/terminos", icon: FileTextIcon, title: "Términos y licencia", text: "Lo que aceptaste al instalar FChat", ready: true },
  { href: "#", icon: TagIcon, title: "Etiquetas y campos", text: "Próximamente", ready: false },
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
