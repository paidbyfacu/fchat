import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AtSignIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/mc/feedback"
import { Page } from "@/components/mc/page-header"
import { defaultWizard } from "@/lib/wizard"
import { listAccounts } from "@/server/queries"
import { requireUser } from "@/server/session"
import { WizardForm } from "../wizard-form"

export const metadata: Metadata = { title: "Nueva automatización" }

async function Form() {
  const user = await requireUser()
  const accounts = (await listAccounts(user.id)).filter((a) => a.status === "ok")
  if (!accounts.length) {
    return (
      <EmptyState
        icon={AtSignIcon}
        title="Primero conecta Instagram"
        description="Para crear una automatización hace falta una cuenta profesional conectada."
        action={
          <Link href="/settings/instagram" className={buttonVariants()}>
            Conectar Instagram
          </Link>
        }
      />
    )
  }
  return <WizardForm id={null} initial={defaultWizard(accounts[0].id)} status="draft" accounts={accounts.map((a) => ({ id: a.id, username: a.username }))} />
}

export default function NewAutomationPage() {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[600px] bg-muted" />}>
        <Form />
      </Suspense>
    </Page>
  )
}
