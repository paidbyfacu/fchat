import Link from "next/link"
import { Logo } from "@/components/mc/logo"
import { TermsBody } from "@/components/mc/terms"
import { getT, pageTitle } from "@/server/i18n"

export const generateMetadata = pageTitle((t) => t.auth.termsTitle)

export default async function TermsPage() {
  const { locale, t } = await getT()
  return (
    <main className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
      <Link href="/" aria-label={t.auth.backToFchat} className="w-fit">
        <Logo />
      </Link>
      <h1 className="text-display">{t.auth.termsPageTitle}</h1>
      <TermsBody locale={locale} />
    </main>
  )
}
