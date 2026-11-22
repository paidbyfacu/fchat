import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ArrowLeftIcon, PencilIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Page, PageHeader } from "@/components/mc/page-header"
import { Funnel } from "@/components/mc/stats"
import { StatusBadge } from "@/components/mc/status-badge"
import { scopeText } from "@/lib/format"
import { getAutomation, funnel } from "@/server/queries"
import { requireUser } from "@/server/session"
import type { Graph, SendMessageNode } from "@/server/engine/graph"
import { StatusToggle } from "../status-toggle"
import { DeleteAutomationButton } from "../delete-button"

const NODE_LABEL: Record<string, string> = {
  open: "Primer DM (respuesta privada)",
  ask: "Si no te sigue",
  link: "DM con el link",
}

async function Detail({ params }: { params: PageProps<"/automations/[id]">["params"] }) {
  const { id } = await params
  const user = await requireUser()
  const a = await getAutomation(user.id, id)
  if (!a) notFound()
  const f = await funnel(user.id, a.id)
  const graph = a.graph as Graph | null
  const messages = (graph?.nodes.filter((n) => n.type === "send_message") ?? []) as SendMessageNode[]
  return (
    <>
      <PageHeader
        title={a.name}
        description={`@${a.username} · ${a.keywords?.length ? a.keywords.map((k) => `«${k}»`).join(", ") : "cualquier comentario"} en ${scopeText(a.post_scope, a.media_ids)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.status} />
            <DeleteAutomationButton id={a.id} name={a.name} />
            <Link href={`/automations/${a.id}/edit`} className={buttonVariants({ variant: "outline" })}>
              <PencilIcon aria-hidden /> Editar
            </Link>
            <StatusToggle id={a.id} name={a.name} status={a.status} />
          </div>
        }
      />
      <section aria-labelledby="embudo" className="grid gap-3">
        <h2 id="embudo" className="text-lg">
          Últimos 7 días
        </h2>
        <Funnel
          steps={[
            { label: "Comentaron", value: f.triggered ?? 0 },
            { label: "Recibieron el DM", value: f.dm_sent ?? 0 },
            { label: "Tocaron el botón", value: f.opened ?? 0 },
            { label: "Te siguen", value: f.followed ?? 0 },
            { label: "Recibieron el link", value: f.link_sent ?? 0 },
          ]}
        />
      </section>
      <section aria-labelledby="mensajes" className="grid gap-3">
        <h2 id="mensajes" className="text-lg">
          Mensajes
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {messages.map((m) => (
            <li key={m.id} className="grid content-start gap-2 rounded-md bg-card p-4 shadow-card">
              <span className="text-xs font-medium text-muted-foreground">{NODE_LABEL[m.id] ?? m.id}</span>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.buttons?.length ? (
                <ul className="grid gap-1.5">
                  {m.buttons.map((b) => (
                    <li key={b.id} className="rounded-sm bg-muted px-3 py-1.5 text-center text-sm font-medium">
                      {b.title}
                      {b.type === "url" && <span className="block truncate text-xs font-normal text-muted-foreground">{b.url}</span>}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}

export default function AutomationPage({ params }: PageProps<"/automations/[id]">) {
  return (
    <Page>
      <Link href="/automations" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden /> Automatizaciones
      </Link>
      <Suspense fallback={<Skeleton className="h-96 bg-muted" />}>
        <Detail params={params} />
      </Suspense>
    </Page>
  )
}
