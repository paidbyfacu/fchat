import type { Metadata } from "next"
import { InboxIcon } from "lucide-react"
import { EmptyState } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"

export const metadata: Metadata = { title: "Bandeja" }

export default function InboxPage() {
  return (
    <Page>
      <PageHeader title="Bandeja" description="Conversaciones para responder a mano." />
      <EmptyState
        icon={InboxIcon}
        title="La bandeja llega en el hito 3"
        description="Los mensajes ya se guardan: cuando esté lista, vas a ver todo el historial y vas a poder responder dentro de la ventana de 24 h."
      />
    </Page>
  )
}
