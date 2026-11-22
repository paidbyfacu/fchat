import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { deviceLabel } from "@/lib/device"
import { timeAgo } from "@/lib/format"
import { passwordFromEnv } from "@/server/bootstrap"
import { getDb } from "@/server/db"
import { requireUser } from "@/server/session"
import { PasswordForm } from "./password-form"
import { RevokeOthersButton, RevokeSessionButton } from "./session-buttons"

export const metadata: Metadata = { title: "Seguridad" }

async function Sessions() {
  const user = await requireUser()
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
                  {deviceLabel(r.user_agent)}
                  {current && <span className="ml-2 text-xs font-normal text-success">esta sesión</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  IP {r.ip ?? "desconocida"} · entró {timeAgo(r.created_at)} · usado {timeAgo(r.last_seen_at)}
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
  const user = await requireUser()
  const fromEnv = passwordFromEnv(user.email)
  return (
    <section aria-labelledby="clave" className="grid gap-3 md:max-w-2xl">
      <h2 id="clave" className="text-lg">
        Contraseña
      </h2>
      {fromEnv ? (
        <Banner tone="info" title="Tu contraseña sale de las variables de tu servidor">
          Para cambiarla, cambia OWNER_PASSWORD en Vercel y vuelve a desplegar. Al hacerlo se cierran todas las sesiones.
        </Banner>
      ) : (
        <PasswordForm />
      )}
    </section>
  )
}

export default function SecurityPage() {
  return (
    <Page>
      <Link href="/settings" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        ← Ajustes
      </Link>
      <PageHeader title="Seguridad" description="Los lugares donde el panel está abierto ahora. Si ves uno que no reconoces, ciérralo y cambia la contraseña." />
      <Banner tone="info" title="Cómo se protege el panel">
        Cada sesión dura 30 días y se puede cerrar desde aquí. Después de 5 intentos fallidos, esa IP queda bloqueada 15 minutos. Cambiar
        la contraseña cierra las demás sesiones.
      </Banner>
      <section aria-labelledby="sesiones" className="grid gap-3">
        <h2 id="sesiones" className="text-lg">
          Sesiones abiertas
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
