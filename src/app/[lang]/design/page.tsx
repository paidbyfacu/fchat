import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { PlusIcon, WorkflowIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TopNav } from "@/components/mc/top-nav"
import { logout } from "@/app/[lang]/(app)/actions"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { ConversationItem } from "@/components/mc/inbox"
import { Funnel, StatTile } from "@/components/mc/stats"
import { StatusBadge } from "@/components/mc/status-badge"
import { ComposerDemo, OverlaysDemo, TogglesDemo, WizardDemo } from "./demo"

export const metadata: Metadata = { title: "Design system" }

// Reference page for the design system, in English only. It does not exist in production.
const COLORS = [
  "bg", "surface", "subtle", "border", "border-input", "text", "text-muted", "accent", "on-accent",
  "link", "focus", "danger", "danger-subtle", "success", "success-subtle", "warning", "warning-subtle",
  "highlight", "phone", "bubble-in", "bubble-out",
]
const TYPE = [
  ["display", "text-display", "Automations"],
  ["xl", "text-xl", "Comment → DM"],
  ["lg", "text-lg", "When someone comments on"],
  ["base", "text-base", "Reply to every comment with a DM, even while you are offline."],
  ["sm", "text-sm", "Interface text, labels and tables."],
  ["xs", "text-xs", "Notes, counters and badges"],
] as const

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <div className="grid gap-1">
        <h2 id={id} className="text-xl">
          {title}
        </h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DESIGN !== "1") notFound()

  return (
    <main className="mx-auto grid max-w-[var(--tk-layout-content-max)] gap-14 px-4 py-10 sm:px-6">
      <header className="grid gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Design system</p>
        <h1 className="text-display">Components</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Everything comes from <code className="font-mono text-sm">src/app/tokens.css</code>. To change the brand, edit
          <code className="font-mono text-sm">--tk-brand</code> and <code className="font-mono text-sm">--tk-accent</code>.
        </p>
      </header>

      <Section id="colores" title="Colors" note="Roles, not colors. Brand is the brand color and accent the button color.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map((c) => (
            <li key={c} className="grid gap-1.5">
              <span className="h-12 rounded-sm border border-border" style={{ background: `var(--tk-${c})` }} />
              <span className="font-mono text-xs">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tipo" title="Typography" note="Inter. Scale 12 · 14 · 16 · 18 · 24 · 32.">
        <div className="grid gap-3 rounded-md bg-card p-5 shadow-card">
          {TYPE.map(([name, cls, sample]) => (
            <div key={name} className="grid grid-cols-[64px_1fr] items-baseline gap-4">
              <span className="font-mono text-xs text-muted-foreground">{name}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="botones" title="Buttons" note="sm 32 · md 40 · lg 48. Try Tab: focus is always visible.">
        <div className="grid gap-4 rounded-md bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Publish</Button>
            <Button variant="outline">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">View details</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="New automation">
              <PlusIcon />
            </Button>
            <Button disabled>Disabled</Button>
            <Button loading>Publishing</Button>
          </div>
        </div>
      </Section>

      <Section id="campos" title="Fields">
        <div className="grid gap-4 rounded-md bg-card p-5 shadow-card sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Name
            <Input placeholder="Guide link" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            URL
            <Input defaultValue="hello" aria-invalid aria-describedby="url-err" />
            <span id="url-err" className="text-xs font-normal text-destructive">
              It must start with https://
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted-foreground">
            Disabled
            <Input disabled defaultValue="@youraccount" />
          </label>
        </div>
        <TogglesDemo />
      </Section>

      <Section
        id="asistente"
        title="Wizard: comment → DM"
        note="Option rows, keyword chips, message editor and preview, all connected. Try deleting the reply button of the first DM."
      >
        <WizardDemo />
      </Section>

      <Section id="estados" title="States">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="live" locale="en" />
          <StatusBadge status="draft" locale="en" />
          <StatusBadge status="stopped" locale="en" />
          <StatusBadge status="error" locale="en" />
          <StatusBadge status="new" locale="en" />
        </div>
        <div className="grid gap-3">
          <Banner tone="danger" title="Reconnect @youraccount" action={<Button size="sm">Reconnect</Button>}>
            Instagram access expired. Nothing gets answered in the meantime.
          </Banner>
          <Banner tone="warning" title="Another automation already uses the keyword &quot;link&quot;">
            If both reply, the faster one wins and the other fails.
          </Banner>
          <Banner tone="success" title="Automation active" />
          <Banner tone="info" title="The dashboard address changed">
            Update it in the Meta dashboard.
          </Banner>
        </div>
      </Section>

      <Section id="metricas" title="Metrics">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Comments" value={1284} delta={12} />
          <StatTile label="DMs sent" value={1190} delta={9} />
          <StatTile label="New followers" value={312} delta={-4} />
          <StatTile label="Link clicks" value={null} />
        </div>
        <Funnel
          steps={[
            { label: "Commented", value: 1284 },
            { label: "Got the DM", value: 1190 },
            { label: "Tapped the button", value: 802 },
            { label: "Follow you", value: 655 },
            { label: "Opened the link", value: 431 },
          ]}
        />
      </Section>

      <Section id="tabla" title="Table">
        <div className="overflow-x-auto rounded-md bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Runs, 7 days</TableHead>
                <TableHead>Edited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Free guide", "live", 412, "today"],
                ["Tool list", "stopped", 0, "3 days ago"],
                ["November giveaway", "draft", 0, "yesterday"],
              ].map(([name, status, n, when]) => (
                <TableRow key={name as string}>
                  <TableCell>
                    <a href="#" className="font-medium hover:underline">
                      {name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status as "live" | "stopped" | "draft"} locale="en" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{n}</TableCell>
                  <TableCell className="text-muted-foreground">{when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-2 rounded-md bg-card p-4 shadow-card" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-muted" />
          ))}
        </div>
      </Section>

      <Section id="bandeja" title="Inbox">
        <div className="grid gap-1 rounded-md bg-card p-2 shadow-card md:max-w-sm">
          <ConversationItem name="razerlife_roleplay" preview="Following 🙌" time="20:34" unread={2} hoursLeft={23} active />
          <ConversationItem name="maria.ok" preview="Does it work for shops?" time="yesterday" unread={0} hoursLeft={3} />
          <ConversationItem name="lu_garcia" preview="Thanks!" time="Mon" unread={0} hoursLeft={null} />
        </div>
        <ComposerDemo />
      </Section>

      <Section id="overlays" title="Modal, toast and tooltip">
        <OverlaysDemo />
      </Section>

      <Section id="vacio" title="Empty state">
        <EmptyState
          icon={WorkflowIcon}
          title="No automations yet"
          description="Start with the most used one: reply with a DM to whoever comments a keyword."
          action={
            <Button>
              <PlusIcon /> Create the first one
            </Button>
          }
        />
      </Section>

      <Section id="nav" title="Navigation">
        <div className="relative overflow-visible rounded-md shadow-card">
          <TopNav current="/automations" username="@youraccount" email="you@example.com" unread={3} logout={logout} />
        </div>
      </Section>
    </main>
  )
}
