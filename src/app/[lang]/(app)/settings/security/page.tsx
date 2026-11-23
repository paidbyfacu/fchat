import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { deviceLabel } from "@/lib/device"
import { timeAgo } from "@/lib/format"
import { fmt } from "@/lib/i18n/locale"
import { passwordFromEnv } from "@/server/bootstrap"
import { getDb } from "@/server/db"
import { getT, pageTitle } from "@/server/i18n"
import { requireUser } from "@/server/session"
import { PasswordForm } from "./password-form"
import { RevokeOthersButton, RevokeSessionButton } from "./session-buttons"

export const generateMetadata = pageTitle((t) => t.settings.securityTitle)

async function Sessions() {
  const [user, { locale, t }] = await Promise.all([requireUser(), getT()])
  const db = await getDb()
  const rows = await db.query<{ id: string; created_at: Date; last_seen_at: Date; ip: string | null; user_agent: string | null }>(
    `select id, created_at, last_seen_at, ip, user_agent from sessions
     where user_id = $1 and revoked_at is null and expires_at > now()
     order by last_seen_at desc`,
    [user.id],
  )
  const others = rows.filter((r) => r.id !== user.sessionId).length
  return (
    <div className="grid gap-4 md:max-w-2xl">
      <ul className="grid gap-2">
        {rows.map((r) => {
          const current = r.id === user.sessionId
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-md bg-card p-4 shadow-card">
              <div className="grid min-w-0 flex-1 gap-1">
                <span className="font-medium">
                  {deviceLabel(r.user_agent, locale)}
                  {current && <span className="ml-2 text-xs font-normal text-success">{t.settings.thisSession}</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmt(t.settings.sessionMeta, {
                    ip: r.ip ?? t.common.unknown,
                    created: timeAgo(r.created_at, locale),
                    seen: timeAgo(r.last_seen_at, locale),
                  })}
                </span>
              </div>
              <RevokeSessionButton sessionId={r.id} current={current} />
            </li>
          )
        })}
      </ul>
      {others > 0 && (
        <div>
          <RevokeOthersButton />
        </div>
      )}
    </div>
  )
}

async function Password() {
  const [user, { t }] = await Promise.all([requireUser(), getT()])
  const fromEnv = passwordFromEnv(user.email)
  return (
    <section aria-labelledby="clave" className="grid gap-3 md:max-w-2xl">
      <h2 id="clave" className="text-lg">
        {t.settings.passwordTitle}
      </h2>
      {fromEnv ? (
        <Banner tone="info" title={t.settings.passwordFromEnvTitle}>
          {t.settings.passwordFromEnvText}
        </Banner>
      ) : (
        <PasswordForm />
      )}
    </section>
  )
}

export default async function SecurityPage() {
  const { t } = await getT()
  const s = t.settings
  return (
    <Page>
      <Link href="/settings" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        {s.backToSettings}
      </Link>
      <PageHeader title={s.securityTitle} description={s.securityDescription} />
      <Banner tone="info" title={s.securityHowTitle}>
        {s.securityHowText}
      </Banner>
      <section aria-labelledby="sesiones" className="grid gap-3">
        <h2 id="sesiones" className="text-lg">
          {s.sessionsTitle}
        </h2>
        <Suspense fallback={<Skeleton className="h-24 bg-muted" />}>
          <Sessions />
        </Suspense>
      </section>
      <Suspense fallback={<Skeleton className="h-48 bg-muted md:max-w-2xl" />}>
        <Password />
      </Suspense>
    </Page>
  )
}
