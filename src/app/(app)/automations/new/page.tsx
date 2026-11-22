import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AtSignIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/mc/feedback"
import { Page } from "@/components/mc/page-header"
import { defaultWizard, type Wizard } from "@/lib/wizard"
import { listAccounts } from "@/server/queries"
import { requireUser } from "@/server/session"
import { WizardForm } from "../wizard-form"

export const metadata: Metadata = { title: "Nueva automatización" }

/** Arranca el asistente con lo que trae cada plantilla del inicio. */
function fromTemplate(w: Wizard, plantilla: unknown): Wizard {
  if (plantilla === "comentario-dm") return { ...w, name: "Link por DM desde los comentarios", askFollow: { ...w.askFollow, on: false } }
  if (plantilla === "seguidores") return { ...w, name: "Link solo para seguidores", askFollow: { ...w.askFollow, on: true, maxAsks: 0 } }
  return w
}

async function Form({ searchParams }: { searchParams: PageProps<"/automations/new">["searchParams"] }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams])
  const accounts = (await listAccounts(user.id)).filter((a) => a.status === "ok")
  if (!accounts.length) {
    return (
      <EmptyState
        icon={AtSignIcon}
        title="Primero conecta Instagram"
        description="Para crear una automatización hace falta una cuenta profesional conectada."
        action={
          <Link href="/conectar" className={buttonVariants()}>
            Conectar Instagram
          </Link>
        }
      />
    )
  }
  return <WizardForm id={null} initial={fromTemplate(defaultWizard(accounts[0].id), sp.plantilla)} status="draft" accounts={accounts.map((a) => ({ id: a.id, username: a.username }))} />
}

export default function NewAutomationPage({ searchParams }: PageProps<"/automations/new">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[600px] bg-muted" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}
