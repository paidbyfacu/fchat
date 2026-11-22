"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { HomeIcon, InboxIcon, MenuIcon, SettingsIcon, UsersIcon, WorkflowIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/mc/logo"
import { cn } from "@/lib/utils"

export const NAV = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/automations", label: "Automatizaciones", icon: WorkflowIcon },
  { href: "/contacts", label: "Contactos", icon: UsersIcon },
  { href: "/inbox", label: "Bandeja", icon: InboxIcon },
  { href: "/settings", label: "Ajustes", icon: SettingsIcon },
] as const

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`))

function NavList({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  return (
    <ul className="grid gap-0.5">
      {NAV.map((item) => {
        const active = isActive(item.href, current)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-sm px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                active &&
                  "bg-brand-subtle text-on-brand-subtle before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-pill before:bg-brand hover:bg-brand-subtle hover:text-on-brand-subtle",
              )}
            >
              <item.icon className={cn("size-4", active && "text-primary")} aria-hidden />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function AccountBadge({ username, picture }: { username: string; picture?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5">
      <Avatar className="size-7">
        {picture && <AvatarImage src={picture} alt="" />}
        <AvatarFallback>{username.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate text-sm font-semibold">@{username}</span>
    </div>
  )
}

/** `current` solo para la página /design; en la app sale de la URL. */
export function AppSidebar({
  username,
  picture,
  current,
  footer,
}: {
  username: string
  picture?: string | null
  current?: string
  footer?: ReactNode
}) {
  const path = usePathname()
  return (
    <aside className="flex h-full w-[var(--tk-layout-sidebar)] flex-col gap-4 border-r border-border bg-sidebar p-3">
      <Link href="/" aria-label="FChat, ir al inicio" className="rounded-sm px-2 pt-1 pb-2">
        <Logo />
      </Link>
      <AccountBadge username={username} picture={picture} />
      <nav aria-label="Principal" className="flex-1">
        <NavList current={current ?? path} />
      </nav>
      {footer}
    </aside>
  )
}

/** Debajo de md: barra arriba con un menú desplegable. */
export function MobileNav({ username, footer }: { username: string; footer?: ReactNode }) {
  const path = usePathname()
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-sidebar md:hidden">
      <details className="group">
        <summary className="flex h-[var(--tk-layout-header)] cursor-pointer list-none items-center justify-between gap-3 px-4 [&::-webkit-details-marker]:hidden">
          <Logo compact />
          <span className="sr-only">Cuenta @{username}</span>
          <span className="grid size-10 place-items-center rounded-sm hover:bg-muted">
            <MenuIcon className="size-5" aria-hidden />
            <span className="sr-only">Menú</span>
          </span>
        </summary>
        <nav aria-label="Principal" className="grid gap-3 px-3 pb-3">
          <AccountBadge username={username} />
          <NavList
            current={path}
            onNavigate={() => document.querySelector<HTMLDetailsElement>("header details")?.removeAttribute("open")}
          />
          {footer}
        </nav>
      </details>
    </header>
  )
}
