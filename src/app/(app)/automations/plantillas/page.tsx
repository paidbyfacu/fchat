import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { TemplateCard } from "@/components/mc/template-card"
import { TEMPLATES } from "@/lib/templates"
import { AutomationTabs } from "../automation-tabs"

export const metadata: Metadata = { title: "Plantillas" }

async function Welcome({ searchParams }: { searchParams: PageProps<"/automations/plantillas">["searchParams"] }) {
  const sp = await searchParams
  if (!sp.bienvenida) return null
  return (
    <Banner tone="success" title="Crea tu primera automatización">
      Elige una plantilla y FChat te arma todo para que solo cambies los textos y el link. La más usada es la primera.
    </Banner>
  )
}

export default function TemplatesPage({ searchParams }: PageProps<"/automations/plantillas">) {
  const ready = TEMPLATES.filter((t) => t.ready)
  const soon = TEMPLATES.filter((t) => !t.ready)
  return (
    <Page>
      <PageHeader title="Automatizaciones" description="Qué pasa cuando alguien comenta o te escribe." />
      <AutomationTabs current="/automations/plantillas" />
      <Suspense fallback={null}>
        <Welcome searchParams={searchParams} />
      </Suspense>
      <section aria-labelledby="listas" className="grid gap-3">
        <h2 id="listas" className="text-lg">
          Listas para usar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((t) => (
            <TemplateCard key={t.id} t={t} detailed />
          ))}
          <Link
            href="/automations/new"
            className="grid min-h-52 place-items-center rounded-lg border-2 border-dashed border-border p-5 text-center text-sm font-semibold text-muted-foreground hover:border-brand hover:text-foreground"
          >
            <span className="grid justify-items-center gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-card text-xl shadow-card">+</span>
              Empezar desde cero
            </span>
          </Link>
        </div>
      </section>
      <section aria-labelledby="pronto" className="grid gap-3">
        <div className="grid gap-1">
          <h2 id="pronto" className="text-lg">
            Próximamente
          </h2>
          <p className="text-sm text-muted-foreground">Llegan en las próximas versiones de FChat y se instalan solas con las actualizaciones.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {soon.map((t) => (
            <TemplateCard key={t.id} t={t} detailed />
          ))}
        </div>
      </section>
    </Page>
  )
}
