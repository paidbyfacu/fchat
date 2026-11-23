import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ExternalLinkIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelBadge } from "@/components/mc/channel-icons"
import { Banner } from "@/components/mc/feedback"
import { Page } from "@/components/mc/page-header"
import { StatusBadge } from "@/components/mc/status-badge"
import { daysLeft } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Messages } from "@/lib/i18n"
import { fmt } from "@/lib/i18n/locale"
import { rich } from "@/lib/i18n/rich"
import { getT, pageTitle } from "@/server/i18n"
import { getSetting, igApp, secrets } from "@/server/config"
import { env } from "@/server/env"
import { homeSummary, listAccounts, type AccountRow } from "@/server/queries"
import { requireUser } from "@/server/session"
import { CopyChip, CopyField, IgAppForm } from "./conectar-client"
import { ResubscribeButton } from "./resubscribe-button"

export const generateMetadata = pageTitle((t) => t.conectar.title)

type T = Messages["conectar"]

const errors = (t: T): Record<string, string> => ({
  denied: t.errDenied,
  state: t.errState,
  exchange: t.errExchange,
  config: t.errConfig,
})

/** Bold words inside a translated sentence. */
const b = (text: string) => rich(text, { b: (c) => <strong>{c}</strong> })

const META_APPS = "https://developers.facebook.com/apps/"

async function Banners({ searchParams }: { searchParams: PageProps<"/[lang]/conectar">["searchParams"] }) {
  const [sp, { t: all }] = await Promise.all([searchParams, getT()])
  const t = all.conectar
  if (sp.connected) {
    return (
      <Banner
        tone="success"
        title={t.connectedTitle}
        action={
          <Link href="/automations/plantillas?bienvenida=1" className={buttonVariants({ size: "sm" })}>
            {t.createFirst}
          </Link>
        }
      >
        {t.connectedText}
      </Banner>
    )
  }
  const err = typeof sp.error === "string" ? errors(t)[sp.error] : undefined
  if (err) return <Banner tone="danger" title={t.failedTitle}>{err}</Banner>
  if (sp.bienvenida) {
    return (
      <Banner tone="success" title={t.readyTitle}>
        {t.readyText}
      </Banner>
    )
  }
  return null
}

function statusOf(a: AccountRow, t: T) {
  if (a.status === "ok") return <StatusBadge status="live" label={t.statusConnected} />
  if (a.status === "expired") return <StatusBadge status="error" label={t.statusExpired} />
  return <StatusBadge status="stopped" label={t.statusMissing} />
}

async function Channels() {
  const user = await requireUser()
  const [accounts, app, { t: all }] = await Promise.all([listAccounts(user.id), igApp().catch(() => null), getT()])
  const t = all.conectar
  return (
    <section aria-labelledby="canales" className="grid gap-3">
      <h2 id="canales" className="text-lg">
        {t.channels}
      </h2>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-3 rounded-lg bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <ChannelBadge channel="instagram" className="size-9 rounded-md" />
            <span className="grid flex-1 gap-0.5">
              <span className="font-semibold">Instagram</span>
              <span className="text-xs text-muted-foreground">{t.igText}</span>
            </span>
            {accounts.length === 0 &&
              (app ? (
                <a href="/api/instagram/connect" className={buttonVariants()}>
                  {t.connectInstagram}
                </a>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">{t.notConnected}</span>
              ))}
          </div>
          {accounts.length > 0 && (
            <ul className="grid gap-2">
              {accounts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                  <Avatar size="lg">
                    {a.profile_pic_url && <AvatarImage src={a.profile_pic_url} alt="" />}
                    <AvatarFallback>{a.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">@{a.username}</span>
                      {statusOf(a, t)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.status === "ok"
                        ? fmt(t.renews, { n: daysLeft(a.token_expires_at) })
                        : t.reconnectToReply}
                      {" · "}
                      {a.webhooks_subscribed ? t.webhooksOn : t.webhooksOff}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ResubscribeButton accountId={a.id} username={a.username} />
                    <a
                      href="/api/instagram/connect"
                      className={buttonVariants({ size: "sm", variant: a.status === "ok" ? "ghost" : "default" })}
                    >
                      {t.reconnect}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid content-start gap-2 rounded-lg bg-card/70 p-4 shadow-card sm:p-5" aria-disabled>
          <div className="flex items-center gap-3">
            <ChannelBadge channel="tiktok" className="size-9 rounded-md" />
            <span className="grid flex-1 gap-0.5">
              <span className="font-semibold">TikTok</span>
              <span className="text-xs text-muted-foreground">{t.tiktokText}</span>
            </span>
            <span className="rounded-pill bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">{all.common.comingSoon}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t.tiktokSoon}</p>
        </div>
      </div>
    </section>
  )
}

type Step = {
  title: string
  time: string
  done: boolean
  body: ReactNode
  /** A step FChat cannot detect: you read it and do it, and the next one opens at the same time. */
  manual?: boolean
}

function StepCard({ n, step, current, open, t }: { n: number; step: Step; current: boolean; open: boolean; t: T }) {
  return (
    <li>
      <details
        open={open}
        className={cn(
          "group rounded-lg bg-card shadow-card",
          current && "ring-2 ring-brand/50",
        )}
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
              step.done ? "bg-success text-white" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            {step.done ? <CheckIcon className="size-4" /> : n}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="font-semibold">
              <span className="sr-only">{fmt(t.stepSr, { n })}</span>
              {step.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {step.done ? t.stepDone : current ? fmt(t.stepCurrent, { time: step.time }) : step.time}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 text-sm sm:px-5 sm:pl-16">{step.body}</div>
      </details>
    </li>
  )
}

function Where({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-subtle px-3 py-2 text-xs text-muted-foreground">{children}</p>
}

function List({ children }: { children: ReactNode }) {
  return <ol className="grid list-decimal gap-2 pl-5 marker:font-semibold marker:text-muted-foreground">{children}</ol>
}

async function Guide() {
  const user = await requireUser()
  const [app, verified, accounts, summary, verifyToken] = await Promise.all([
    igApp().catch(() => null),
    getSetting("webhook_verified_at"),
    listAccounts(user.id),
    homeSummary(user.id),
    secrets.webhookVerify(),
  ])
  const t = (await getT()).t.conectar
  const minutes = (n: number) => (n === 1 ? t.min1 : fmt(t.minN, { n }))
  const url = env.publicUrl()
  const isPublic = url.startsWith("https://")
  const connected = accounts.length > 0
  const tested = summary.comments > 0

  const steps: Step[] = [
    {
      title: t.s1,
      time: minutes(2),
      manual: true,
      done: connected || !!app,
      body: (
        <List>
          <li>{b(t.s1a)}</li>
          <li>{b(t.s1b)}</li>
          <li>{t.s1c}</li>
        </List>
      ),
    },
    {
      title: t.s2,
      time: minutes(3),
      manual: true,
      done: !!app,
      body: (
        <>
          <p className="text-muted-foreground">{t.s2Intro}</p>
          <List>
            <li>{b(t.s2a)}</li>
            <li>{b(t.s2b)}</li>
            <li>{t.s2c}</li>
          </List>
          <a href={META_APPS} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
            {t.openMeta} <ExternalLinkIcon aria-hidden />
          </a>
        </>
      ),
    },
    {
      title: t.s3,
      time: minutes(1),
      done: !!app,
      body:
        app?.source === "env" ? (
          <p className="text-muted-foreground">{t.s3Env}</p>
        ) : (
          <>
            <Where>{t.s3Where}</Where>
            <p className="text-muted-foreground">{b(t.s3Text)}</p>
            <IgAppForm savedId={app?.appId} />
          </>
        ),
    },
    {
      title: t.s4,
      time: minutes(2),
      done: !!verified,
      body: (
        <>
          <p className="text-muted-foreground">{t.s4Intro}</p>
          <Where>{t.s4Where}</Where>
          <CopyField label={t.callbackUrl} value={`${url}/webhook`} />
          <CopyField label={t.verifyToken} value={verifyToken} secret />
          <List>
            <li>{b(t.s4a)}</li>
            <li>
              {t.s4b} <CopyChip value="comments" /> <CopyChip value="messages" /> <CopyChip value="messaging_postbacks" />
            </li>
          </List>
          {verified ? (
            <p className="flex items-center gap-1.5 text-success">
              <CheckIcon className="size-4" aria-hidden /> {t.s4Verified}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{t.s4Pending}</p>
          )}
        </>
      ),
    },
    {
      title: t.s5,
      time: minutes(2),
      done: connected,
      body: (
        <>
          <Where>{t.s5Where}</Where>
          <CopyField
            label={t.redirectUri}
            value={`${url}/api/instagram/callback`}
            hint={t.redirectHint}
          />
          <p className="text-muted-foreground">{t.s5Text}</p>
          {app ? (
            <a href="/api/instagram/connect" className={cn(buttonVariants(), "w-fit")}>
              {connected ? t.connectAnother : t.connectInstagram}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">{t.s5NoApp}</p>
          )}
          <details className="rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">{t.s5Token}</summary>
            <div className="mt-2 grid gap-2 text-muted-foreground">
              <p>{t.s5TokenText}</p>
            </div>
          </details>
        </>
      ),
    },
    {
      title: t.s6,
      time: minutes(3),
      done: tested,
      body: (
        <>
          <p className="text-muted-foreground">{t.s6Intro}</p>
          <Where>{t.s6Where}</Where>
          <CopyField label={t.privacyUrl} value={`${url}/privacy`} />
          <CopyField label={t.deletionUrl} value={`${url}/data-deletion`} />
          <List>
            <li>{t.s6a}</li>
            <li>{b(t.s6b)}</li>
          </List>
          <p className="text-xs text-muted-foreground">{t.s6Note}</p>
        </>
      ),
    },
    {
      title: t.s7,
      time: minutes(3),
      done: tested,
      body: (
        <>
          <List>
            <li>{t.s7a}</li>
            <li>{t.s7b}</li>
            <li>{t.s7c}</li>
          </List>
          <p className="text-xs text-muted-foreground">{t.s7Note}</p>
          <Link href="/automations/plantillas?bienvenida=1" className={cn(buttonVariants(), "w-fit")}>
            {t.chooseTemplate} <ArrowRightIcon aria-hidden />
          </Link>
        </>
      ),
    },
  ]
  const currentIndex = steps.findIndex((s) => !s.done)
  const done = steps.filter((s) => s.done).length

  return (
    <section aria-labelledby="guia" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="guia" className="text-lg">
            {connected ? t.guideDone : t.guideTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentIndex === -1
              ? t.allDone
              : fmt(t.progress, { done, total: steps.length })}
          </p>
        </div>
        <a href={META_APPS} target="_blank" rel="noreferrer" className="text-sm font-semibold text-link hover:underline">
          {t.myApps}
        </a>
      </div>
      {!isPublic && (
        <Banner tone="warning" title={t.publicTitle}>
          {fmt(t.publicText, { url })}
        </Banner>
      )}
      <ol className="grid gap-3">
        {steps.map((s, i) => (
          <StepCard
            key={s.title}
            n={i + 1}
            step={s}
            current={i === currentIndex}
            t={t}
            // manual steps open together with the first one FChat does detect
            open={currentIndex !== -1 && i >= currentIndex && steps.slice(currentIndex, i).every((p) => p.manual)}
          />
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">{t.metaChanges}</p>
    </section>
  )
}

export default async function ConectarPage({ searchParams }: PageProps<"/[lang]/conectar">) {
  const t = (await getT()).t.conectar
  return (
    <Page>
      <header className="grid gap-1">
        <h1 className="text-display leading-tight">
          {rich(t.heading, { g: (c) => <span className="fc-gradient-text">{c}</span> })}
        </h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </header>
      <Suspense fallback={null}>
        <Banners searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 bg-muted/60" />}>
        <Channels />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 bg-muted/60" />}>
        <Guide />
      </Suspense>
    </Page>
  )
}
