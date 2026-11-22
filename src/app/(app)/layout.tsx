import { Suspense } from "react"
import { LogOutIcon } from "lucide-react"
import { AppSidebar, MobileNav } from "@/components/mc/app-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { listAccounts } from "@/server/queries"
import { requireUser } from "@/server/session"
import { logout } from "./actions"

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex h-10 w-full items-center gap-3 rounded-sm px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogOutIcon className="size-4" aria-hidden /> Salir
      </button>
    </form>
  )
}

async function who() {
  const user = await requireUser()
  const [acc] = await listAccounts(user.id)
  return { username: acc?.username ?? user.email.split("@")[0], picture: acc?.profile_pic_url ?? null }
}

async function Sidebar() {
  const w = await who()
  return <AppSidebar username={w.username} picture={w.picture} footer={<LogoutButton />} />
}

async function Mobile() {
  const w = await who()
  return <MobileNav username={w.username} footer={<LogoutButton />} />
}

function SidebarSkeleton() {
  return (
    <div className="grid h-full w-[var(--tk-layout-sidebar)] content-start gap-3 border-r border-border bg-sidebar p-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-9 bg-muted" />
      ))}
    </div>
  )
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh">
      <div className="sticky top-0 hidden h-svh shrink-0 md:block">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-[var(--tk-layout-header)] border-b border-border bg-sidebar md:hidden" />}>
          <Mobile />
        </Suspense>
        {children}
      </div>
    </div>
  )
}
