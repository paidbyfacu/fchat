import Link from "next/link"
import type { ComponentType } from "react"
import { BarChart3Icon, ClockIcon, ListOrderedIcon, MousePointerClickIcon, SendIcon, TimerIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { cn } from "@/lib/utils"
import { fmt, intlLocale, type Locale } from "@/lib/i18n/locale"
import { rich } from "@/lib/i18n/rich"
import type { Messages } from "@/lib/i18n"
import { getT, pageTitle } from "@/server/i18n"
import { AutomationTabs } from "../automation-tabs"

export const generateMetadata = pageTitle((t) => t.automations.seqTitle)

type Item = { kind: "start" | "message" | "wait"; title: string; text?: string; when?: string; stats?: string }

/** A made-up example of a sequence, to show what it will look like. */
function example(t: Messages["automations"], locale: Locale): Item[] {
  const n = (x: number) => x.toLocaleString(intlLocale(locale))
  const stats = (sent: number, clicks: number) => fmt(t.seqStats, { sent: n(sent), clicks: `${clicks}%` })
  return [
    { kind: "start", title: t.seqStart, text: t.seqStartText },
    { kind: "message", title: fmt(t.seqMsg, { n: 1 }), when: t.seqNow, text: t.seqMsg1, stats: stats(1240, 61) },
    { kind: "wait", title: fmt(t.seqWait, { n: 3 }) },
    { kind: "message", title: fmt(t.seqMsg, { n: 2 }), when: fmt(t.seqAt, { n: 3 }), text: t.seqMsg2, stats: stats(1180, 34) },
    { kind: "wait", title: fmt(t.seqWait, { n: 18 }) },
    { kind: "message", title: fmt(t.seqMsg, { n: 3 }), when: fmt(t.seqAt, { n: 21 }), text: t.seqMsg3, stats: stats(1010, 22) },
  ]
}

function Timeline({ items }: { items: Item[] }) {
  return (
    <ol className="relative grid gap-3 before:absolute before:top-4 before:bottom-4 before:left-[1.0625rem] before:w-0.5 before:bg-border">
      {items.map((it, i) => (
        <li key={i} className="relative flex gap-3">
          <span
            className={cn(
              "z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-card",
              it.kind === "start" && "bg-primary text-primary-foreground",
              it.kind === "message" && "bg-brand-subtle text-on-brand-subtle",
              it.kind === "wait" && "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            {it.kind === "start" ? (
              <MousePointerClickIcon className="size-4" />
            ) : it.kind === "message" ? (
              <SendIcon className="size-4" />
            ) : (
              <TimerIcon className="size-4" />
            )}
          </span>
          {it.kind === "wait" ? (
            <span className="self-center text-sm font-medium text-muted-foreground">{it.title}</span>
          ) : (
            <span className="grid min-w-0 flex-1 gap-1 rounded-md bg-card p-3 shadow-card">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold">{it.title}</span>
                {it.when && <span className="text-xs text-muted-foreground">{it.when}</span>}
              </span>
              {it.text && <span className="text-sm text-muted-foreground">{it.text}</span>}
              {it.stats && <span className="text-xs font-medium text-success">{it.stats}</span>}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export default async function SequencesPage() {
  const { locale, t: all } = await getT()
  const t = all.automations
  const HOW: { icon: ComponentType<{ className?: string }>; title: string; text: string }[] = [
    { icon: MousePointerClickIcon, title: t.seqHow1, text: t.seqHow1Text },
    { icon: ListOrderedIcon, title: t.seqHow2, text: t.seqHow2Text },
    { icon: BarChart3Icon, title: t.seqHow3, text: t.seqHow3Text },
  ]
  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <AutomationTabs current="/automations/secuencias" />

      <section className="relative grid gap-8 overflow-hidden rounded-lg bg-card p-5 shadow-card sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <div className="grid gap-3">
            <span className="w-fit rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{all.common.comingSoon}</span>
            <h2 className="text-display leading-tight">
              {rich(t.seqHeading, { g: (c) => <span className="fc-gradient-text">{c}</span> })}
            </h2>
            <p className="text-muted-foreground">{t.seqIntro}</p>
          </div>
          <ol className="grid gap-3">
            {HOW.map((h, i) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-on-brand-subtle">
                  <h.icon className="size-4" aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">
                    {i + 1}. {h.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{h.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid content-start gap-3 rounded-lg bg-subtle p-4 sm:p-5">
          <p className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
            {t.seqLooks}
            <span className="rounded-pill bg-card px-2 py-0.5 font-medium">{t.seqExample}</span>
          </p>
          <Timeline items={example(t, locale)} />
        </div>
      </section>

      <Banner tone="info" title={t.seqRuleTitle}>
        {t.seqRule}
      </Banner>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-card p-5 shadow-card">
        <span className="flex items-start gap-3">
          <ClockIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="grid gap-0.5">
            <span className="font-semibold">{t.seqMeanwhile}</span>
            <span className="text-sm text-muted-foreground">{t.seqMeanwhileText}</span>
          </span>
        </span>
        <Link href="/automations/plantillas" className={buttonVariants()}>
          {t.seqSeeTemplates}
        </Link>
      </section>
    </Page>
  )
}
