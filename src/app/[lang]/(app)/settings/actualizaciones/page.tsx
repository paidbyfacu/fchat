import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { CheckIcon, ExternalLinkIcon, RefreshCwIcon, SparklesIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { cn } from "@/lib/utils"
import { requireUser } from "@/server/session"
import { getT, pageTitle } from "@/server/i18n"
import { fmt } from "@/lib/i18n/locale"
import { rich } from "@/lib/i18n/rich"
import type { Messages } from "@/lib/i18n"
import { createWorkflowUrl, runWorkflowUrl, UPSTREAM_REPO, updateInfo, type UpdateInfo } from "@/server/update"

export const generateMetadata = pageTitle((t) => t.settings.updatesTitle)

function Versions({ u, t }: { u: UpdateInfo; t: Messages["settings"] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg bg-card p-5 shadow-card">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full",
          u.outdated ? "bg-brand-subtle text-on-brand-subtle" : "bg-success-subtle text-success",
        )}
        aria-hidden
      >
        {u.outdated ? <SparklesIcon className="size-5" /> : <CheckIcon className="size-5" />}
      </span>
      <span className="grid flex-1 gap-0.5">
        <span className="font-semibold">
          {u.outdated ? fmt(t.newVersion, { latest: u.latest ?? "" }) : u.latest ? t.latestVersion : fmt(t.versionN, { current: u.current })}
        </span>
        <span className="text-sm text-muted-foreground">
          {fmt(t.youHave, { current: u.current })} {!u.latest ? t.githubDown : u.outdated ? t.seeBelow : t.isLatest}
        </span>
      </span>
      <a
        href={`https://github.com/${UPSTREAM_REPO}/commits/main`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-link hover:underline"
      >
        {t.whatChanged}
      </a>
    </div>
  )
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="grid list-decimal gap-2 pl-5 text-sm marker:font-semibold marker:text-muted-foreground">{children}</ol>
}

function Code({ children }: { children: ReactNode }) {
  return <pre className="overflow-x-auto rounded-md bg-foreground px-4 py-3 font-mono text-[0.8125rem] leading-relaxed text-background">{children}</pre>
}

async function Status() {
  await requireUser()
  const [u, { t: all }] = await Promise.all([updateInfo(), getT()])
  const t = all.settings

  if (u.isUpstream) {
    return (
      <>
        <Versions u={u} t={t} />
        <Banner tone="info" title={t.upstreamTitle}>
          {t.upstreamText}
        </Banner>
      </>
    )
  }

  if (u.onVercel && u.repo && u.autoUpdate) {
    return (
      <>
        <Versions u={u} t={t} />
        <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg">{t.autoTitle}</h2>
            <span className="rounded-pill bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success">{t.active}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {fmt(t.autoText, { repo: `${u.repo.owner}/${u.repo.slug}` })}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={runWorkflowUrl(u.repo)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: u.outdated ? "default" : "outline" })}>
              <RefreshCwIcon aria-hidden /> {t.updateNow}
            </a>
            <span className="text-xs text-muted-foreground">{t.runWorkflowHint}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.pausedHint}
          </p>
        </section>
      </>
    )
  }

  if (u.onVercel && u.repo) {
    return (
      <>
        <Versions u={u} t={t} />
        <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card ring-2 ring-brand/40">
          <div className="grid gap-1">
            <h2 className="text-lg">{t.enableTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {t.enableText}
            </p>
          </div>
          <Steps>
            <li>{t.enableStep1}</li>
            <li>{rich(t.enableStep2, { b: (c) => <strong>{c}</strong> })}</li>
            <li>{t.enableStep3}</li>
          </Steps>
          <a href={createWorkflowUrl(u.repo)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "w-fit")}>
            {t.enableOnGithub} <ExternalLinkIcon aria-hidden />
          </a>
          <p className="text-xs text-muted-foreground">
            {fmt(t.enableFileHint, { repo: `${u.repo.owner}/${u.repo.slug}` })}
          </p>
        </section>
      </>
    )
  }

  if (u.onVercel) {
    return (
      <>
        <Versions u={u} t={t} />
        <Banner tone="warning" title={t.noRepoTitle}>
          {t.noRepoText}
        </Banner>
      </>
    )
  }

  return (
    <>
      <Versions u={u} t={t} />
      <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card">
        <div className="grid gap-1">
          <h2 className="text-lg">{t.manualTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {t.manualText}
          </p>
        </div>
        <Code>{`git pull\nnpm install`}</Code>
        <p className="text-xs text-muted-foreground">
          {t.manualHint}
        </p>
      </section>
    </>
  )
}

export default async function UpdatesPage() {
  const t = (await getT()).t.settings
  return (
    <Page>
      <Link href="/settings" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        {t.backToSettings}
      </Link>
      <PageHeader title={t.updatesTitle} description={t.updatesDescription} />
      <div className="grid gap-4 md:max-w-3xl">
        <Suspense fallback={<Skeleton className="h-48 bg-muted" />}>
          <Status />
        </Suspense>
      </div>
    </Page>
  )
}
