import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ArrowRightIcon, CheckIcon, MessageCircleIcon, UsersIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { InstagramGlyph } from "@/components/mc/channel-icons"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { StatTile } from "@/components/mc/stats"
import { TemplateCard } from "@/components/mc/template-card"
import { daysLeft, timeAgo } from "@/lib/format"
import { TEMPLATES } from "@/lib/templates"
import { cn } from "@/lib/utils"
import { funnel, homeSummary, listAccounts, recentComments } from "@/server/queries"
import { requireUser } from "@/server/session"
import { updateInfo } from "@/server/update"

export const metadata: Metadata = { title: "Inicio" }

const STATUS_TEXT: Record<string, string> = {
  replied: "DM enviado",
  matched: "en curso",
  ignored: "sin automatización",
  failed: "falló",
  received: "recibido",
  expired: "vencido",
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("es")} ${n === 1 ? one : many}`

async function Hero() {
  const user = await requireUser()
  const [s, accounts] = await Promise.all([homeSummary(user.id), listAccounts(user.id)])
  const first = user.name?.trim().split(/\s+/)[0] || accounts[0]?.username || user.email.split("@")[0]
  return (
    <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-brand">Empieza aquí</p>
        <h1 className="text-display leading-tight">
          ¡Hola, <span className="fc-gradient-text">{first}</span>!
        </h1>
        <p className="text-muted-foreground">Esto es lo que puedes automatizar hoy en tus redes.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/conectar"
          className="flex items-center gap-2 rounded-pill bg-card px-4 py-2 text-sm font-medium shadow-card hover:shadow-pop"
        >
          <InstagramGlyph className="size-4 text-[#e1306c]" />
          {plural(s.accounts, "canal conectado", "canales conectados")}
        </Link>
        <Link
          href="/contacts"
          className="flex items-center gap-2 rounded-pill bg-card px-4 py-2 text-sm font-medium shadow-card hover:shadow-pop"
        >
          <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
          {plural(s.contacts, "contacto", "contactos")}
        </Link>
      </div>
    </section>
  )
}

async function Alerts() {
  const user = await requireUser()
  const accounts = await listAccounts(user.id)
  if (!accounts.length) {
    return (
      <Banner
        tone="info"
        title="Vincula tu cuenta de Instagram"
        action={
          <Link href="/conectar" className={buttonVariants({ size: "sm" })}>
            Vincular
          </Link>
        }
      >
        Sin una cuenta conectada no llega ningún comentario. La guía te lleva paso a paso.
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
            action={
              <Link href="/conectar" className={buttonVariants({ size: "sm" })}>
                Revisar
              </Link>
            }
          >
            {a.status === "ok" ? "Se intenta renovar solo; si falla, reconéctala." : "Mientras tanto no se responde nada en esa cuenta."}
          </Banner>
        ))}
    </>
  )
}

type Step = { title: string; description: string; done: boolean; href?: string; cta?: string; external?: boolean }

async function NextSteps() {
  const user = await requireUser()
  const [s, u] = await Promise.all([homeSummary(user.id), updateInfo()])
  const steps: Step[] = [
    { title: "Crea tu cuenta de FChat", description: "Ya tienes tu panel propio.", done: true },
    {
      title: "Vincula tu Instagram",
      description: "Conecta tu cuenta profesional con la guía paso a paso.",
      done: s.accounts > 0,
      href: "/conectar",
      cta: "Vincular",
    },
    {
      title: "Crea tu primera automatización",
      description: "Empieza con la plantilla de comentarios a DM.",
      done: s.automations > 0,
      href: "/automations/plantillas",
      cta: "Elegir plantilla",
    },
    {
      title: "Actívala",
      description: "Una automatización en borrador no responde a nadie.",
      done: s.live > 0,
      href: "/automations",
      cta: "Ir a mis automatizaciones",
    },
    {
      title: "Recibe tu primer comentario",
      description: "Pídele a un amigo que comente la palabra clave en tu post para probarla.",
      done: s.comments > 0,
    },
    {
      title: "Responde desde la bandeja",
      description: "Contesta a mano a quien te escribió, sin salir de FChat.",
      done: s.humanReplies > 0,
      href: "/inbox",
      cta: "Abrir la bandeja",
    },
  ]
  if (u.onVercel && !u.isUpstream) {
    steps.push({
      title: "Activa las actualizaciones automáticas",
      description: "Un clic en GitHub y FChat se mantiene al día solo.",
      done: u.autoUpdate,
      href: "/settings/actualizaciones",
      cta: "Activar",
    })
  }
  const done = steps.filter((x) => x.done).length
  const next = steps.find((x) => !x.done)
  return (
    <section aria-labelledby="pasos" className="grid gap-4 rounded-lg bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="pasos" className="text-lg">
            Tus próximos mejores pasos
          </h2>
          <p className="text-sm text-muted-foreground">
            {done === steps.length ? "¡Completaste todo! Ya tienes FChat funcionando." : `${done} de ${steps.length} completados`}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-pill bg-muted sm:w-56"
          role="progressbar"
          aria-label="Avance"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={done}
        >
          <div className="h-full rounded-pill bg-[linear-gradient(90deg,#d97757,#b9a2ff)]" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="grid gap-2">
        {steps.map((x) => {
          const current = x === next
          return (
            <li
              key={x.title}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-md border border-transparent px-3 py-3",
                current && "border-brand/40 bg-brand-subtle/50",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2",
                  x.done ? "border-success bg-success text-white" : current ? "border-brand" : "border-border",
                )}
                aria-hidden
              >
                {x.done && <CheckIcon className="size-3.5" />}
              </span>
              <span className="grid min-w-[min(100%,14rem)] flex-1 gap-0.5">
                <span className={cn("text-sm font-semibold", x.done && "text-muted-foreground line-through decoration-1")}>
                  {x.title}
                  <span className="sr-only">{x.done ? ", hecho" : ", pendiente"}</span>
                </span>
                {!x.done && <span className="text-xs text-muted-foreground">{x.description}</span>}
              </span>
              {!x.done && x.href && (
                <Link href={x.href} className={cn(buttonVariants({ size: "sm", variant: current ? "default" : "outline" }), "ml-9 sm:ml-0")}>
                  {x.cta} <ArrowRightIcon aria-hidden />
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

async function Stats() {
  const user = await requireUser()
  const f = await funnel(user.id)
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Comentarios que activaron algo" value={f.triggered ?? 0} />
      <StatTile label="DM enviados" value={f.dm_sent ?? 0} />
      <StatTile label="Tocaron el botón" value={f.opened ?? 0} />
      <StatTile label="Recibieron el link" value={f.link_sent ?? 0} />
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
    <ul className="grid divide-y divide-border rounded-lg bg-card shadow-card">
      {rows.map((r, i) => (
        <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span className="min-w-0">
            <span className="font-medium">{r.username ? `@${r.username}` : "Alguien"}</span> <span className="text-muted-foreground">comentó</span>{" "}
            <span className="break-words">«{r.text}»</span>
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
  const featured = TEMPLATES.slice(0, 5)
  return (
    <main className="mx-auto grid w-full max-w-[var(--tk-layout-content-max)] content-start gap-8 px-4 py-8 sm:px-6 md:py-10">
      <Suspense fallback={<Skeleton className="h-28 bg-muted/60" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <Alerts />
      </Suspense>

      <section aria-labelledby="plantillas" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="grid gap-1">
            <h2 id="plantillas" className="text-lg">
              Empieza con una plantilla
            </h2>
            <p className="text-sm text-muted-foreground">Elige qué quieres que pase y FChat te guía para armarlo en minutos.</p>
          </div>
          <Link href="/automations/plantillas" className="text-sm font-semibold text-link hover:underline">
            Ver todas las plantillas
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
          <Link
            href="/automations/new"
            className="grid min-h-52 place-items-center rounded-lg border-2 border-dashed border-border p-5 text-center text-sm font-semibold text-muted-foreground hover:border-brand hover:text-foreground"
          >
            <span className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-card text-xl shadow-card">+</span>
              Empezar desde cero
            </span>
          </Link>
        </div>
      </section>

      <Suspense fallback={<Skeleton className="h-80 bg-muted/60" />}>
        <NextSteps />
      </Suspense>

      <section aria-labelledby="semana" className="grid gap-4">
        <div className="grid gap-1">
          <h2 id="semana" className="text-lg">
            Tus últimos 7 días
          </h2>
          <p className="text-sm text-muted-foreground">Lo que hicieron tus automatizaciones esta semana.</p>
        </div>
        <Suspense fallback={tiles}>
          <Stats />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 bg-muted" />}>
          <Activity />
        </Suspense>
      </section>
    </main>
  )
}
