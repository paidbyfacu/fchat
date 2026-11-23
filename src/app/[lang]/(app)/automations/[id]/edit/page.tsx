import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Page } from "@/components/mc/page-header"
import { getDb } from "@/server/db"
import { loadWizard } from "@/server/automations"
import { listAccounts } from "@/server/queries"
import { requireUser } from "@/server/session"
import { pageTitle } from "@/server/i18n"
import { WizardForm } from "../../wizard-form"

export const generateMetadata = pageTitle((t) => t.automations.editTitle)

async function Form({ params }: { params: PageProps<"/[lang]/automations/[id]/edit">["params"] }) {
  const { id } = await params
  const user = await requireUser()
  const loaded = await loadWizard(await getDb(), user.id, id)
  if (!loaded) notFound()
  const accounts = await listAccounts(user.id)
  return (
    <WizardForm
      id={id}
      initial={loaded.wizard}
      status={loaded.status as "draft" | "live" | "stopped"}
      accounts={accounts.map((a) => ({ id: a.id, username: a.username }))}
    />
  )
}

export default function EditAutomationPage({ params }: PageProps<"/[lang]/automations/[id]/edit">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[600px] bg-muted" />}>
        <Form params={params} />
      </Suspense>
    </Page>
  )
}
