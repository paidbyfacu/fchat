import Link from "next/link"
import { Suspense } from "react"
import { SparklesIcon } from "lucide-react"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { TopNav } from "@/components/mc/top-nav"
import { fmt } from "@/lib/i18n/locale"
import { getT } from "@/server/i18n"
import { listAccounts, unreadTotal } from "@/server/queries"
import { requireUser } from "@/server/session"
import { runWorkflowUrl, updateInfo } from "@/server/update"
import { logout } from "./actions"

async function Nav() {
  const user = await requireUser()
  const [accounts, unread] = await Promise.all([listAccounts(user.id), unreadTotal(user.id)])
  const acc = accounts[0]
  return (
    <TopNav
      username={acc ? `@${acc.username}` : (user.name ?? user.email.split("@")[0])}
      picture={acc?.profile_pic_url ?? null}
      email={user.email}
      unread={unread}
      logout={logout}
    />
  )
}

function NavSkeleton() {
  return (
    <div className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-[var(--tk-layout-header)] max-w-[var(--tk-layout-content-max)] items-center px-4 sm:px-6">
        <Logo size="sm" />
      </div>
    </div>
  )
}

/** Strip at the top when a new FChat version is published. */
async function UpdateNotice() {
  await requireUser()
  const [u, { t }] = await Promise.all([updateInfo(), getT()])
  if (!u.outdated || u.isUpstream) return null
  const href = u.autoUpdate && u.repo ? runWorkflowUrl(u.repo) : "/settings/actualizaciones"
  return (
    <div role="status" className="border-b border-border bg-brand-subtle text-on-brand-subtle">
      <div className="mx-auto flex max-w-[var(--tk-layout-content-max)] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm sm:px-6">
        <SparklesIcon className="size-4 shrink-0" aria-hidden />
        <p className="flex-1">
          {fmt(t.common.updateAvailable, { latest: u.latest ?? "", current: u.current })}
          {u.autoUpdate ? t.common.updateAuto : t.common.updateManual}
        </p>
        {u.autoUpdate && u.repo ? (
          <a href={href} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
            {t.common.updateNow}
          </a>
        ) : (
          <Link href={href} className="font-semibold underline underline-offset-2">
            {t.common.updateHowTo}
          </Link>
        )}
      </div>
    </div>
  )
}

export default function AppLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <div className="relative isolate flex min-h-svh flex-col">
      <Aurora className="fixed" />
      <Suspense fallback={<NavSkeleton />}>
        <Nav />
      </Suspense>
      <Suspense fallback={null}>
        <UpdateNotice />
      </Suspense>
      {children}
    </div>
  )
}
