import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { PlusIcon, WorkflowIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { StatusBadge } from "@/components/mc/status-badge"
import { buttonVariants } from "@/components/ui/button"
import { scopeText, timeAgo } from "@/lib/format"
import { listAutomations } from "@/server/queries"
import { requireUser } from "@/server/session"
import { StatusToggle } from "./status-toggle"

export const metadata: Metadata = { title: "Automatizaciones" }

async function List() {
  const user = await requireUser()
  const rows = await listAutomations(user.id)
  if (!rows.length) {
    return (
      <EmptyState
        icon={WorkflowIcon}
        title="Todavía no hay automatizaciones"
        description="Empieza por la más usada: responder con un DM a quien comenta una palabra en tus posts."
        action={
          <Link href="/automations/new" className={buttonVariants()}>
            <PlusIcon aria-hidden /> Crear la primera
          </Link>
        }
      />
    )
  }
  return (
    <div className="overflow-x-auto rounded-md bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Se activa con</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Disparos (7 d)</TableHead>
            <TableHead className="text-right">Links (7 d)</TableHead>
            <TableHead>Editada</TableHead>
            <TableHead>
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="max-w-72">
                <Link href={`/automations/${a.id}`} className="block truncate font-medium hover:underline">
                  {a.name}
                </Link>
                <span className="text-xs text-muted-foreground">@{a.username}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {a.keywords?.length ? a.keywords.map((k) => `«${k}»`).join(", ") : "cualquier comentario"} en{" "}
                {scopeText(a.post_scope, a.media_ids)}
              </TableCell>
              <TableCell>
                <StatusBadge status={a.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.triggered_7d}</TableCell>
              <TableCell className="text-right tabular-nums">{a.link_sent_7d}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(a.updated_at)}</TableCell>
              <TableCell className="text-right">
                <StatusToggle id={a.id} name={a.name} status={a.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-2 rounded-md bg-card p-4 shadow-card" aria-busy="true" aria-label="Cargando automatizaciones">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 bg-muted" />
      ))}
    </div>
  )
}

export default function AutomationsPage() {
  return (
    <Page>
      <PageHeader
        title="Automatizaciones"
        description="Qué pasa cuando alguien comenta o te escribe."
        action={
          <Link href="/automations/new" className={buttonVariants()}>
            <PlusIcon aria-hidden /> Nueva
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton />}>
        <List />
      </Suspense>
    </Page>
  )
}
