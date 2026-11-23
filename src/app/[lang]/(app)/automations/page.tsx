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
import { getT, pageTitle } from "@/server/i18n"
import { fmt, quote } from "@/lib/i18n/locale"
import { AutomationTabs } from "./automation-tabs"
import { StatusToggle } from "./status-toggle"

export const generateMetadata = pageTitle((t) => t.automations.title)

async function List() {
  const [user, { locale, t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.automations
  const rows = await listAutomations(user.id)
  if (!rows.length) {
    return (
      <EmptyState
        icon={WorkflowIcon}
        title={t.emptyTitle}
        description={t.emptyText}
        action={
          <Link href="/automations/plantillas" className={buttonVariants()}>
            <PlusIcon aria-hidden /> {t.chooseTemplate}
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
            <TableHead>{t.colName}</TableHead>
            <TableHead>{t.colTrigger}</TableHead>
            <TableHead>{t.colStatus}</TableHead>
            <TableHead className="text-right">{t.colTriggered}</TableHead>
            <TableHead className="text-right">{t.colLinks}</TableHead>
            <TableHead>{t.colEdited}</TableHead>
            <TableHead>
              <span className="sr-only">{t.colActions}</span>
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
                {fmt(t.triggerOn, {
                  words: a.keywords?.length ? a.keywords.map((k) => quote(locale, k)).join(", ") : t.anyComment,
                  scope: scopeText(a.post_scope, a.media_ids, locale),
                })}
              </TableCell>
              <TableCell>
                <StatusBadge status={a.status} locale={locale} />
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.triggered_7d}</TableCell>
              <TableCell className="text-right tabular-nums">{a.link_sent_7d}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{timeAgo(a.updated_at, locale)}</TableCell>
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

function ListSkeleton({ label }: { label: string }) {
  return (
    <div className="grid gap-2 rounded-md bg-card p-4 shadow-card" aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 bg-muted" />
      ))}
    </div>
  )
}

export default async function AutomationsPage() {
  const t = (await getT()).t.automations
  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        action={
          <Link href="/automations/new" className={buttonVariants()}>
            <PlusIcon aria-hidden /> {t.newButton}
          </Link>
        }
      />
      <AutomationTabs current="/automations" />
      <Suspense fallback={<ListSkeleton label={t.loading} />}>
        <List />
      </Suspense>
    </Page>
  )
}
