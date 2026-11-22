import type { Metadata } from "next"
import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { CheckIcon, ExternalLinkIcon, RefreshCwIcon, SparklesIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { cn } from "@/lib/utils"
import { requireUser } from "@/server/session"
import { createWorkflowUrl, runWorkflowUrl, UPSTREAM_REPO, updateInfo, type UpdateInfo } from "@/server/update"

export const metadata: Metadata = { title: "Actualizaciones" }

function Versions({ u }: { u: UpdateInfo }) {
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
          {u.outdated ? `Hay una versión nueva: la ${u.latest}` : u.latest ? "Tienes la última versión" : `Versión ${u.current}`}
        </span>
        <span className="text-sm text-muted-foreground">
          Tienes la {u.current}.{" "}
          {!u.latest
            ? "Ahora no se pudo consultar GitHub; se vuelve a intentar en un rato."
            : u.outdated
              ? "Abajo ves cómo instalarla."
              : "Es la más reciente."}
        </span>
      </span>
      <a
        href={`https://github.com/${UPSTREAM_REPO}/commits/main`}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-semibold text-link hover:underline"
      >
        Ver qué cambió
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
  const u = await updateInfo()

  if (u.isUpstream) {
    return (
      <>
        <Versions u={u} />
        <Banner tone="info" title="Esta es la instalación que publica FChat">
          Cada cambio que subes a GitHub lo publica Vercel, y las demás instalaciones lo reciben con su actualización automática.
        </Banner>
      </>
    )
  }

  if (u.onVercel && u.repo && u.autoUpdate) {
    return (
      <>
        <Versions u={u} />
        <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg">Actualizaciones automáticas</h2>
            <span className="rounded-pill bg-success-subtle px-2 py-0.5 text-xs font-semibold text-success">Activas</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Cada 4 horas GitHub revisa si hay una versión nueva. Si la hay, la copia a tu repositorio {u.repo.owner}/{u.repo.slug} y Vercel
            la publica en unos minutos. No tienes que hacer nada.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href={runWorkflowUrl(u.repo)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: u.outdated ? "default" : "outline" })}>
              <RefreshCwIcon aria-hidden /> Actualizar ahora
            </a>
            <span className="text-xs text-muted-foreground">En GitHub, toca «Run workflow» y otra vez «Run workflow».</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Si tu repositorio es público y pasa 60 días sin cambios, GitHub pausa la revisión y te avisa por email. Para reactivarla, entra a
            la pestaña Actions de tu repositorio y toca «Enable workflow».
          </p>
        </section>
      </>
    )
  }

  if (u.onVercel && u.repo) {
    return (
      <>
        <Versions u={u} />
        <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card ring-2 ring-brand/40">
          <div className="grid gap-1">
            <h2 className="text-lg">Activa las actualizaciones automáticas</h2>
            <p className="text-sm text-muted-foreground">
              Se hace una sola vez y tarda un minuto. Después, cada versión nueva de FChat se instala sola en tu Vercel.
            </p>
          </div>
          <Steps>
            <li>Toca el botón: se abre GitHub con el archivo de actualización ya escrito.</li>
            <li>
              Arriba a la derecha toca <strong>Commit changes</strong>, y en la ventana que aparece, otra vez <strong>Commit changes</strong>.
            </li>
            <li>Listo. Vercel se vuelve a publicar solo y en unos minutos esta página dice «Activas».</li>
          </Steps>
          <a href={createWorkflowUrl(u.repo)} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "w-fit")}>
            Activar en GitHub <ExternalLinkIcon aria-hidden />
          </a>
          <p className="text-xs text-muted-foreground">
            El archivo se guarda en {u.repo.owner}/{u.repo.slug}, en .github/workflows. Si cambias el código de FChat a mano, cada
            actualización reemplaza esos cambios; para conservarlos, desactiva el workflow en la pestaña Actions.
          </p>
        </section>
      </>
    )
  }

  if (u.onVercel) {
    return (
      <>
        <Versions u={u} />
        <Banner tone="warning" title="Tu Vercel no está conectado a un repositorio de GitHub">
          Para que FChat se actualice solo, instálalo con el botón Deploy del README: así Vercel crea tu repositorio y lo conecta.
        </Banner>
      </>
    )
  }

  return (
    <>
      <Versions u={u} />
      <section className="grid gap-4 rounded-lg bg-card p-5 shadow-card">
        <div className="grid gap-1">
          <h2 className="text-lg">Actualizar en tu computadora o servidor</h2>
          <p className="text-sm text-muted-foreground">
            Si instalaste FChat con git clone, en la carpeta de FChat corre esto y vuelve a arrancarlo como siempre:
          </p>
        </div>
        <Code>{`git pull\nnpm install`}</Code>
        <p className="text-xs text-muted-foreground">
          Tus datos no se tocan: están en la base de datos, fuera del código. Las migraciones nuevas se aplican solas al arrancar.
        </p>
      </section>
    </>
  )
}

export default function UpdatesPage() {
  return (
    <Page>
      <Link href="/settings" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        ← Ajustes
      </Link>
      <PageHeader title="Actualizaciones" description="Qué versión de FChat tienes y cómo se mantiene al día." />
      <div className="grid gap-4 md:max-w-3xl">
        <Suspense fallback={<Skeleton className="h-48 bg-muted" />}>
          <Status />
        </Suspense>
      </div>
    </Page>
  )
}
