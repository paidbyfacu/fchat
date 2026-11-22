import type { Metadata } from "next"
import { Suspense } from "react"
import { UsersIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { timeAgo } from "@/lib/format"
import { listContacts } from "@/server/queries"
import { requireUser } from "@/server/session"

export const metadata: Metadata = { title: "Contactos" }

function windowText(last: Date | null) {
  if (!last) return { text: "Nunca escribió", open: false }
  const left = 24 - (Date.now() - last.getTime()) / 3600_000
  return left > 0 ? { text: `Abierta · ${Math.floor(left)} h`, open: true } : { text: "Cerrada", open: false }
}

async function List() {
  const user = await requireUser()
  const rows = await listContacts(user.id)
  if (!rows.length) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nadie interactuó todavía"
        description="Cada persona que comenta y recibe un DM aparece aquí, con si te sigue y si la ventana de 24 h está abierta."
      />
    )
  }
  return (
    <div className="overflow-x-auto rounded-md bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>¿Te sigue?</TableHead>
            <TableHead>Tocó un botón</TableHead>
            <TableHead>Ventana de 24 h</TableHead>
            <TableHead>Desde</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const w = windowText(c.last_inbound_at)
            return (
              <TableRow key={c.id}>
                <TableCell className="max-w-64">
                  <span className="block truncate font-medium">{c.username ? `@${c.username}` : `ID ${c.igsid}`}</span>
                  <span className="text-xs text-muted-foreground">en @{c.account}</span>
                </TableCell>
                <TableCell>{c.follows_business === null ? <span className="text-muted-foreground">Sin chequear</span> : c.follows_business ? "Sí" : "No"}</TableCell>
                <TableCell>{c.opted_in ? "Sí" : "No"}</TableCell>
                <TableCell className={w.open ? "text-success" : "text-muted-foreground"}>{w.text}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(c.created_at)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ContactsPage() {
  return (
    <Page>
      <PageHeader title="Contactos" description="Las personas que interactuaron con tus automatizaciones." />
      <Suspense fallback={<Skeleton className="h-64 bg-muted" />}>
        <List />
      </Suspense>
    </Page>
  )
}
