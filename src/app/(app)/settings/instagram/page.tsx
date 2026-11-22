import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AtSignIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { StatusBadge } from "@/components/mc/status-badge"
import { daysLeft } from "@/lib/format"
import { listAccounts, type AccountRow } from "@/server/queries"
import { requireUser } from "@/server/session"
import { ResubscribeButton } from "./resubscribe-button"

export const metadata: Metadata = { title: "Instagram" }

const ERRORS: Record<string, string> = {
  denied: "Cancelaste el permiso en Instagram. No se conectó nada.",
  state: "El enlace de conexión venció. Prueba de nuevo.",
  exchange: "Instagram no devolvió el acceso. Revisa que la URL de redirección esté cargada en el panel de Meta.",
  config: "Falta configurar IG_APP_ID o IG_APP_SECRET en el servidor.",
}

function statusOf(a: AccountRow) {
  if (a.status === "ok") return <StatusBadge status="live" label="Conectada" />
  if (a.status === "expired") return <StatusBadge status="error" label="Acceso vencido" />
  return <StatusBadge status="stopped" label="Faltan permisos" />
}

async function Accounts() {
  const user = await requireUser()
  const accounts = await listAccounts(user.id)
  if (!accounts.length) {
    return (
      <EmptyState
        icon={AtSignIcon}
        title="Ninguna cuenta conectada"
        description="Conecta una cuenta profesional (Empresa o Creador). Te pedirá permiso para leer comentarios y enviar mensajes."
        action={
          <a href="/api/instagram/connect" className={buttonVariants()}>
            Conectar Instagram
          </a>
        }
      />
    )
  }
  return (
    <ul className="grid gap-3">
      {accounts.map((a) => {
        const left = daysLeft(a.token_expires_at)
        return (
          <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-md bg-card p-4 shadow-card">
            <Avatar className="size-10">
              {a.profile_pic_url && <AvatarImage src={a.profile_pic_url} alt="" />}
              <AvatarFallback>{a.username.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold">@{a.username}</span>
                {statusOf(a)}
              </div>
              <p className="text-xs text-muted-foreground">
                {a.status === "ok" ? `El acceso se renueva solo · vence en ${left} días` : "Reconectala para volver a responder"}
                {" · "}
                {a.webhooks_subscribed ? "Webhooks activos" : "Webhooks sin activar"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ResubscribeButton accountId={a.id} username={a.username} />
              <a href="/api/instagram/connect" className={buttonVariants({ size: "sm", variant: a.status === "ok" ? "ghost" : "default" })}>
                Reconectar
              </a>
            </div>
          </li>
        )
      })}
      <li>
        <a href="/api/instagram/connect" className={buttonVariants({ variant: "outline" })}>
          Conectar otra cuenta
        </a>
      </li>
    </ul>
  )
}

async function ErrorBanner({ searchParams }: { searchParams: PageProps<"/settings/instagram">["searchParams"] }) {
  const sp = await searchParams
  const err = typeof sp.error === "string" ? ERRORS[sp.error] : undefined
  if (sp.connected) return <Banner tone="success" title="Cuenta conectada" />
  return err ? <Banner tone="danger" title="No se pudo conectar">{err}</Banner> : null
}

export default function InstagramSettingsPage({ searchParams }: PageProps<"/settings/instagram">) {
  return (
    <Page>
      <Link href="/settings" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        ← Ajustes
      </Link>
      <PageHeader title="Instagram" description="Las cuentas que responden comentarios y mensajes." />
      <Suspense fallback={null}>
        <ErrorBanner searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-24 bg-muted" />}>
        <Accounts />
      </Suspense>
    </Page>
  )
}
