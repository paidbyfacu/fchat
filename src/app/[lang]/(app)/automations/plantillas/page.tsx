import Link from "next/link"
import { Suspense } from "react"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { TemplateCard } from "@/components/mc/template-card"
import { templates } from "@/lib/templates"
import { getT, pageTitle } from "@/server/i18n"
import { AutomationTabs } from "../automation-tabs"

export const generateMetadata = pageTitle((t) => t.automations.templatesTitle)

async function Welcome({ searchParams }: { searchParams: PageProps<"/[lang]/automations/plantillas">["searchParams"] }) {
  const [sp, { t: all }] = await Promise.all([searchParams, getT()])
  if (!sp.bienvenida) return null
  const t = all.automations
  return (
    <Banner tone="success" title={t.welcomeTitle}>
      {t.welcomeText}
    </Banner>
  )
}

export default async function TemplatesPage({ searchParams }: PageProps<"/[lang]/automations/plantillas">) {
  const { locale, t: all } = await getT()
  const t = all.automations
  const list = templates(locale)
  const ready = list.filter((x) => x.ready)
  const soon = list.filter((x) => !x.ready)
  return (
    <Page>
      <PageHeader title={t.title} description={t.description} />
      <AutomationTabs current="/automations/plantillas" />
      <Suspense fallback={null}>
        <Welcome searchParams={searchParams} />
      </Suspense>
      <section aria-labelledby="listas" className="grid gap-3">
        <h2 id="listas" className="text-lg">
          {t.readyTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((x) => (
            <TemplateCard key={x.id} t={x} detailed />
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
      <section aria-labelledby="pronto" className="grid gap-3">
        <div className="grid gap-1">
          <h2 id="pronto" className="text-lg">
            {t.soonTitle}
          </h2>
          <p className="text-sm text-muted-foreground">{t.soonText}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {soon.map((x) => (
            <TemplateCard key={x.id} t={x} detailed />
          ))}
        </div>
      </section>
    </Page>
  )
}
