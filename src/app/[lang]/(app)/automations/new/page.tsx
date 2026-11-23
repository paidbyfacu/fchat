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
import { getT, pageTitle } from "@/server/i18n"
import type { Messages } from "@/lib/i18n"
import { WizardForm } from "../wizard-form"

export const generateMetadata = pageTitle((t) => t.automations.newTitle)

/** Starts the wizard with what each Home template brings. */
function fromTemplate(w: Wizard, plantilla: unknown, t: Messages["automations"]): Wizard {
  if (plantilla === "comentario-dm") return { ...w, name: t.tplCommentName, askFollow: { ...w.askFollow, on: false } }
  if (plantilla === "seguidores") return { ...w, name: t.tplFollowName, askFollow: { ...w.askFollow, on: true, maxAsks: 0 } }
  return w
}

async function Form({ searchParams }: { searchParams: PageProps<"/[lang]/automations/new">["searchParams"] }) {
  const [user, sp, { locale, t: all }] = await Promise.all([requireUser(), searchParams, getT()])
  const t = all.automations
  const accounts = (await listAccounts(user.id)).filter((a) => a.status === "ok")
  if (!accounts.length) {
    return (
      <EmptyState
        icon={AtSignIcon}
        title={t.connectFirst}
        description={t.connectFirstText}
        action={
          <Link href="/conectar" className={buttonVariants()}>
            {t.connectInstagram}
          </Link>
        }
      />
    )
  }
  return <WizardForm id={null} initial={fromTemplate(defaultWizard(accounts[0].id, locale), sp.plantilla, t)} status="draft" accounts={accounts.map((a) => ({ id: a.id, username: a.username }))} />
}

export default function NewAutomationPage({ searchParams }: PageProps<"/[lang]/automations/new">) {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-[600px] bg-muted" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </Page>
  )
}
