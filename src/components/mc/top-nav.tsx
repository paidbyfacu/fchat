"use client"

import Link from "next/link"
import { useRef } from "react"
import {
  ChevronDownIcon,
  FileTextIcon,
  HomeIcon,
  InboxIcon,
  LinkIcon,
  LogOutIcon,
  MenuIcon,
  RefreshCwIcon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocalPath, useT } from "@/components/i18n"
import { Logo } from "@/components/mc/logo"
import { cn } from "@/lib/utils"

export const NAV = [
  { href: "/", label: "navHome", icon: HomeIcon },
  { href: "/automations", label: "navAutomations", icon: WorkflowIcon },
  { href: "/inbox", label: "navInbox", icon: InboxIcon },
  { href: "/contacts", label: "navContacts", icon: UsersIcon },
  { href: "/settings", label: "navSettings", icon: SettingsIcon },
] as const

const isActive = (href: string, path: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`))

function Badge({ n }: { n: number }) {
  const { t } = useT()
  if (!n) return null
  return (
    <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1.5 text-[0.6875rem] leading-none font-semibold text-primary-foreground">
      {n > 99 ? "99+" : n}
      <span className="sr-only">{t.common.unreadSr}</span>
    </span>
  )
}

export type TopNavProps = {
  /** The Instagram @username, or the person's name if they have not connected an account yet. */
  username: string
  picture?: string | null
  email: string
  unread: number
  logout: () => Promise<void>
  /** Only for the /design page: in the app it comes from the URL. */
  current?: string
}

export function TopNav({ username, picture, email, unread, logout, current }: TopNavProps) {
  const { t } = useT()
  const path = useLocalPath()
  const here = current ?? path
  const mobile = useRef<HTMLDetailsElement>(null)
  const close = () => mobile.current?.removeAttribute("open")

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--tk-layout-header)] max-w-[var(--tk-layout-content-max)] items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={t.common.goHome} className="shrink-0 rounded-sm">
          <Logo size="sm" />
        </Link>

        <nav aria-label={t.common.navMain} className="hidden flex-1 justify-center md:flex">
          <ul className="flex items-center gap-1 rounded-pill bg-subtle/80 p-1">
            {NAV.map((item) => {
              const active = isActive(item.href, here)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-pill px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      active && "bg-card text-foreground shadow-card",
                    )}
                  >
                    <item.icon className={cn("size-4", active && "text-primary")} aria-hidden />
                    <span className="hidden lg:inline">{t.common[item.label]}</span>
                    <span className="lg:hidden">{item.label === "navAutomations" ? t.common.navAutomationsShort : t.common[item.label]}</span>
                    {item.href === "/inbox" && <Badge n={unread} />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-pill py-1 pr-2 pl-1 hover:bg-muted aria-expanded:bg-muted">
              <Avatar size="sm" className="size-8">
                {picture && <AvatarImage src={picture} alt="" />}
                <AvatarFallback>{username.replace(/^@/, "").slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-36 truncate text-sm font-semibold lg:inline">{username}</span>
              <ChevronDownIcon className="size-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">{t.common.accountMenu}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-semibold text-foreground">{username}</span>
                  <span className="block truncate text-xs font-normal">{email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/conectar" />}>
                <LinkIcon aria-hidden /> {t.common.menuConnect}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <SettingsIcon aria-hidden /> {t.common.navSettings}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings/actualizaciones" />}>
                <RefreshCwIcon aria-hidden /> {t.common.menuUpdates}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/terminos" target="_blank" />}>
                <FileTextIcon aria-hidden /> {t.common.menuTerms}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()}>
                <LogOutIcon aria-hidden /> {t.common.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <details ref={mobile} className="group md:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-sm hover:bg-muted [&::-webkit-details-marker]:hidden">
              <MenuIcon className="size-5" aria-hidden />
              <span className="sr-only">{t.common.menu}</span>
            </summary>
            <nav aria-label={t.common.navMain} className="absolute inset-x-0 top-full border-b border-border bg-card p-3 shadow-pop">
              <ul className="grid gap-0.5">
                {NAV.map((item) => {
                  const active = isActive(item.href, here)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                          active && "bg-brand-subtle text-on-brand-subtle hover:bg-brand-subtle",
                        )}
                      >
                        <item.icon className="size-4" aria-hidden />
                        <span className="flex-1">{t.common[item.label]}</span>
                        {item.href === "/inbox" && <Badge n={unread} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
