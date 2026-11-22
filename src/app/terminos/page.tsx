import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/mc/logo"
import { TermsBody } from "@/components/mc/terms"

export const metadata: Metadata = { title: "Términos y condiciones" }

export default function TermsPage() {
  return (
    <main className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
      <Link href="/" aria-label="Volver a FChat" className="w-fit">
        <Logo />
      </Link>
      <h1 className="text-display">Términos y condiciones de FChat</h1>
      <TermsBody />
    </main>
  )
}
