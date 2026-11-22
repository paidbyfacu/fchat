import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { MessageCircleIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { StatTile } from "@/components/mc/stats"
import { daysLeft, timeAgo } from "@/lib/format"
import { funnel, listAccounts, recentComments } from "@/server/queries"
import { requireUser } from "@/server/session"

export const metadata: Metadata = { title: "Inicio" }

const STATUS_TEXT: Record<string, string> = {
  replied: "DM enviado",
  matched: "en curso",
  ignored: "sin automatización",
  failed: "falló",
  received: "recibido",
  expired: "vencido",
}

async function Alerts() {
  const user = await requireUser()
  const accounts = await listAccounts(user.id)
  if (!accounts.length) {
    return (
      <Banner tone="info" title="Conecta tu cuenta de Instagram" action={<Link href="/settings/instagram" className={buttonVariants({ size: "sm" })}>Conectar</Link>}>
        Sin una cuenta conectada no llega ningún comentario.
      </Banner>
    )
  }
  return (
    <>
      {accounts
        .filter((a) => a.status !== "ok" || daysLeft(a.token_expires_at) <= 7)
        .map((a) => (
          <Banner
            key={a.id}
            tone={a.status === "ok" ? "warning" : "danger"}
            title={a.status === "ok" ? `El acceso de @${a.username} vence en ${daysLeft(a.token_expires_at)} días` : `Reconecta @${a.username}`}
            action={<Link href="/settings/instagram" className={buttonVariants({ size: "sm" })}>Revisar</Link>}
          >
            {a.status === "ok" ? "Se intenta renovar solo; si falla, reconectala." : "Mientras tanto no se responde nada en esa cuenta."}
          </Banner>
        ))}
    </>
  )
}

async function Stats() {
  const user = await requireUser()
  const f = await funnel(user.id)
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Comentarios que activaron algo (7 d)" value={f.triggered ?? 0} />
      <StatTile label="DMs enviados (7 d)" value={f.dm_sent ?? 0} />
      <StatTile label="Tocaron el botón (7 d)" value={f.opened ?? 0} />
      <StatTile label="Recibieron el link (7 d)" value={f.link_sent ?? 0} />
    </div>
  )
}

async function Activity() {
  const user = await requireUser()
  const rows = await recentComments(user.id)
  if (!rows.length) {
    return (
      <EmptyState
        icon={MessageCircleIcon}
        title="Todavía no llegó ningún comentario"
        description="Cuando alguien comente en tus posts, aparece aquí con lo que hizo la automatización."
      />
    )
  }
  return (
    <ul className="grid divide-y divide-border rounded-md bg-card shadow-card">
      {rows.map((r, i) => (
        <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span className="min-w-0">
            <span className="font-medium">{r.username ? `@${r.username}` : "Alguien"}</span>{" "}
            <span className="text-muted-foreground">comentó</span> <span className="break-words">«{r.text}»</span>
          </span>
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {STATUS_TEXT[r.status] ?? r.status}
            {r.automation ? ` · ${r.automation}` : ""} · {timeAgo(r.at)}
          </span>
        </li>
      ))}
    </ul>
  )
}

const tiles = (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-24 bg-muted" />
    ))}
  </div>
)

export default function HomePage() {
  return (
    <Page>
      <PageHeader title="Inicio" description="Lo que pasó en tus cuentas." />
      <Suspense fallback={null}>
        <Alerts />
      </Suspense>
      <Suspense fallback={tiles}>
        <Stats />
      </Suspense>
      <section aria-labelledby="actividad" className="grid gap-3">
        <h2 id="actividad" className="text-lg">
          Últimos comentarios
        </h2>
        <Suspense fallback={<Skeleton className="h-64 bg-muted" />}>
          <Activity />
        </Suspense>
      </section>
    </Page>
  )
}
