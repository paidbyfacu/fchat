import Link from "next/link"
import { Suspense } from "react"
import { ArrowRightIcon, CheckIcon, MessageCircleIcon, UsersIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { InstagramGlyph } from "@/components/mc/channel-icons"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { StatTile } from "@/components/mc/stats"
import { TemplateCard } from "@/components/mc/template-card"
import { daysLeft, num, timeAgo } from "@/lib/format"
import { templates } from "@/lib/templates"
import { fmt, quote } from "@/lib/i18n/locale"
import { rich } from "@/lib/i18n/rich"
import { getT, pageTitle } from "@/server/i18n"
import { cn } from "@/lib/utils"
import { funnel, homeSummary, listAccounts, recentComments } from "@/server/queries"
import { requireUser } from "@/server/session"
import { updateInfo } from "@/server/update"

export const generateMetadata = pageTitle((t) => t.home.title)

async function Hero() {
  const [user, { locale, t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.home
  const [s, accounts] = await Promise.all([homeSummary(user.id), listAccounts(user.id)])
  const plural = (n: number, one: string, other: string) => fmt(n === 1 ? one : other, { n: num(n, locale) })
  const first = user.name?.trim().split(/\s+/)[0] || accounts[0]?.username || user.email.split("@")[0]
  return (
    <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <div className="grid gap-2">
        <p className="text-sm font-semibold text-brand">{t.startHere}</p>
        <h1 className="text-display leading-tight">
          {rich(fmt(t.hello, { name: first }), { name: (c) => <span className="fc-gradient-text">{c}</span> })}
        </h1>
        <p className="text-muted-foreground">{t.heroText}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/conectar"
          className="flex items-center gap-2 rounded-pill bg-card px-4 py-2 text-sm font-medium shadow-card hover:shadow-pop"
        >
          <InstagramGlyph className="size-4 text-[#e1306c]" />
          {plural(s.accounts, t.channelsOne, t.channelsOther)}
        </Link>
        <Link
          href="/contacts"
          className="flex items-center gap-2 rounded-pill bg-card px-4 py-2 text-sm font-medium shadow-card hover:shadow-pop"
        >
          <UsersIcon className="size-4 text-muted-foreground" aria-hidden />
          {plural(s.contacts, t.contactsOne, t.contactsOther)}
        </Link>
      </div>
    </section>
  )
}

async function Alerts() {
  const [user, { t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.home
  const accounts = await listAccounts(user.id)
  if (!accounts.length) {
    return (
      <Banner
        tone="info"
        title={t.connectTitle}
        action={
          <Link href="/conectar" className={buttonVariants({ size: "sm" })}>
            {t.connect}
          </Link>
        }
      >
        {t.connectText}
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
            title={
              a.status === "ok"
                ? fmt(t.expiresIn, { username: a.username, n: daysLeft(a.token_expires_at) })
                : fmt(t.reconnect, { username: a.username })
            }
            action={
              <Link href="/conectar" className={buttonVariants({ size: "sm" })}>
                {t.review}
              </Link>
            }
          >
            {a.status === "ok" ? t.expiresText : t.downText}
          </Banner>
        ))}
    </>
  )
}

type Step = { title: string; description: string; done: boolean; href?: string; cta?: string; external?: boolean }

async function NextSteps() {
  const [user, { t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.home
  const [s, u] = await Promise.all([homeSummary(user.id), updateInfo()])
  const steps: Step[] = [
    { title: t.stepAccount, description: t.stepAccountText, done: true },
    { title: t.stepInstagram, description: t.stepInstagramText, done: s.accounts > 0, href: "/conectar", cta: t.connect },
    { title: t.stepFirst, description: t.stepFirstText, done: s.automations > 0, href: "/automations/plantillas", cta: t.stepFirstCta },
    { title: t.stepLive, description: t.stepLiveText, done: s.live > 0, href: "/automations", cta: t.stepLiveCta },
    { title: t.stepComment, description: t.stepCommentText, done: s.comments > 0 },
    { title: t.stepInbox, description: t.stepInboxText, done: s.humanReplies > 0, href: "/inbox", cta: t.stepInboxCta },
  ]
  if (u.onVercel && !u.isUpstream) {
    steps.push({ title: t.stepUpdates, description: t.stepUpdatesText, done: u.autoUpdate, href: "/settings/actualizaciones", cta: t.stepUpdatesCta })
  }
  const done = steps.filter((x) => x.done).length
  const next = steps.find((x) => !x.done)
  return (
    <section aria-labelledby="pasos" className="grid gap-4 rounded-lg bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="pasos" className="text-lg">
            {t.stepsTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {done === steps.length ? t.stepsAllDone : fmt(t.stepsProgress, { done, total: steps.length })}
          </p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-pill bg-muted sm:w-56"
          role="progressbar"
          aria-label={t.progress}
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
                  <span className="sr-only">{x.done ? t.stepDone : t.stepPending}</span>
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
  const [user, { t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.home
  const f = await funnel(user.id)
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label={t.statTriggered} value={f.triggered ?? 0} />
      <StatTile label={t.statDmSent} value={f.dm_sent ?? 0} />
      <StatTile label={t.statOpened} value={f.opened ?? 0} />
      <StatTile label={t.statLinkSent} value={f.link_sent ?? 0} />
    </div>
  )
}

async function Activity() {
  const [user, { locale, t: all }] = await Promise.all([requireUser(), getT()])
  const t = all.home
  const status: Record<string, string> = {
    replied: t.statusReplied,
    matched: t.statusMatched,
    ignored: t.statusIgnored,
    failed: t.statusFailed,
    received: t.statusReceived,
    expired: t.statusExpired,
  }
  const rows = await recentComments(user.id)
  if (!rows.length) {
    return (
      <EmptyState
        icon={MessageCircleIcon}
        title={t.noCommentsTitle}
        description={t.noCommentsText}
      />
    )
  }
  return (
    <ul className="grid divide-y divide-border rounded-lg bg-card shadow-card">
      {rows.map((r, i) => (
        <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
          <span className="min-w-0">
            <span className="font-medium">{r.username ? `@${r.username}` : t.someone}</span> <span className="text-muted-foreground">{t.commented}</span>{" "}
            <span className="break-words">{quote(locale, r.text)}</span>
          </span>
          <span className="text-xs whitespace-nowrap text-muted-foreground">
            {status[r.status] ?? r.status}
            {r.automation ? ` · ${r.automation}` : ""} · {timeAgo(r.at, locale)}
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

export default async function HomePage() {
  const { locale, t: all } = await getT()
  const t = all.home
  const featured = templates(locale).slice(0, 5)
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
              {t.templatesTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.templatesText}</p>
          </div>
          <Link href="/automations/plantillas" className="text-sm font-semibold text-link hover:underline">
            {t.allTemplates}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((x) => (
            <TemplateCard key={x.id} t={x} />
          ))}
          <Link
            href="/automations/new"
            className="grid min-h-52 place-items-center rounded-lg border-2 border-dashed border-border p-5 text-center text-sm font-semibold text-muted-foreground hover:border-brand hover:text-foreground"
          >
            <span className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-card text-xl shadow-card">+</span>
              {t.fromScratch}
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
            {t.weekTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{t.weekText}</p>
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
