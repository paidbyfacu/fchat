import { Suspense } from "react"
import { UsersIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { timeAgo } from "@/lib/format"
import { fmt } from "@/lib/i18n/locale"
import type { Messages } from "@/lib/i18n"
import { getT, pageTitle } from "@/server/i18n"
import { listContacts } from "@/server/queries"
import { requireUser } from "@/server/session"

export const generateMetadata = pageTitle((t) => t.contacts.title)

function windowText(last: Date | null, t: Messages["contacts"]) {
  if (!last) return { text: t.neverWrote, open: false }
  const left = 24 - (Date.now() - last.getTime()) / 3600_000
  return left > 0 ? { text: fmt(t.windowOpen, { h: Math.floor(left) }), open: true } : { text: t.windowClosed, open: false }
}

async function List() {
  const user = await requireUser()
  const [rows, { locale, t: all }] = await Promise.all([listContacts(user.id), getT()])
  const t = all.contacts
  if (!rows.length) {
    return <EmptyState icon={UsersIcon} title={t.emptyTitle} description={t.emptyText} />
  }
  return (
    <div className="overflow-x-auto rounded-md bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.user}</TableHead>
            <TableHead>{t.follows}</TableHead>
            <TableHead>{t.tapped}</TableHead>
            <TableHead>{t.window}</TableHead>
            <TableHead>{t.since}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const w = windowText(c.last_inbound_at, t)
            return (
              <TableRow key={c.id}>
                <TableCell className="max-w-64">
                  <span className="block truncate font-medium">{c.username ? `@${c.username}` : `ID ${c.igsid}`}</span>
                  <span className="text-xs text-muted-foreground">{fmt(t.onAccount, { account: c.account })}</span>
                </TableCell>
                <TableCell>
                  {c.follows_business === null ? <span className="text-muted-foreground">{t.unchecked}</span> : c.follows_business ? t.yes : t.no}
                </TableCell>
                <TableCell>{c.opted_in ? t.yes : t.no}</TableCell>
                <TableCell className={w.open ? "text-success" : "text-muted-foreground"}>{w.text}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(c.created_at, locale)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function ContactsPage() {
  const { t } = await getT()
  return (
    <Page>
      <PageHeader title={t.contacts.title} description={t.contacts.description} />
      <Suspense fallback={<Skeleton className="h-64 bg-muted" />}>
        <List />
      </Suspense>
    </Page>
  )
}
