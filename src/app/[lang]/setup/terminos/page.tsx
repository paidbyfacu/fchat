import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { TermsBody } from "@/components/mc/terms"
import { Button } from "@/components/ui/button"
import { TERMS } from "@/lib/terms"
import { getT, pageTitle } from "@/server/i18n"
import { SESSION_COOKIE, sessionUser } from "@/server/session"
import { logout } from "@/app/[lang]/(app)/actions"
import { acceptTerms } from "../actions"

export const generateMetadata = pageTitle((t) => t.auth.termsTab)

async function Content() {
  await connection()
  const user = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  if (!user) redirect("/login")
  if (user.termsAccepted) redirect("/")
  const { locale, t } = await getT()
  return (
    <>
      <ul className="grid gap-1.5 rounded-md border border-border bg-subtle p-4">
        {TERMS[locale].highlights.map((h) => (
          <li key={h} className="text-sm text-muted-foreground">
            · {h}
          </li>
        ))}
      </ul>
      <div className="max-h-[45svh] overflow-y-auto rounded-md border border-border p-4">
        <TermsBody locale={locale} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <form action={logout}>
          <Button type="submit" variant="ghost">
            {t.common.logout}
          </Button>
        </form>
        <form action={acceptTerms}>
          <Button type="submit">{t.auth.acceptTerms}</Button>
        </form>
      </div>
    </>
  )
}

export default async function AcceptTermsPage() {
  const { t } = await getT()
  return (
    <main className="relative isolate grid min-h-svh place-items-center px-4 py-10">
      <Aurora />
      <div className="grid w-full max-w-2xl gap-5 rounded-xl bg-card p-6 shadow-pop sm:p-8">
        <Logo />
        <div className="grid gap-1">
          <h1 className="text-xl">{t.auth.termsTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.termsText}</p>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <Content />
        </Suspense>
      </div>
    </main>
  )
}
