import type { Metadata } from "next"
import { Suspense } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { TERMS_HIGHLIGHTS, TermsBody } from "@/components/mc/terms"
import { Button } from "@/components/ui/button"
import { SESSION_COOKIE, sessionUser } from "@/server/session"
import { logout } from "@/app/(app)/actions"
import { acceptTerms } from "../actions"

export const metadata: Metadata = { title: "Términos" }

async function Content() {
  await connection()
  const user = await sessionUser((await cookies()).get(SESSION_COOKIE)?.value)
  if (!user) redirect("/login")
  if (user.termsAccepted) redirect("/")
  return (
    <>
      <ul className="grid gap-1.5 rounded-md border border-border bg-subtle p-4">
        {TERMS_HIGHLIGHTS.map((t) => (
          <li key={t} className="text-sm text-muted-foreground">
            · {t}
          </li>
        ))}
      </ul>
      <div className="max-h-[45svh] overflow-y-auto rounded-md border border-border p-4">
        <TermsBody />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Salir
          </Button>
        </form>
        <form action={acceptTerms}>
          <Button type="submit">Acepto los términos</Button>
        </form>
      </div>
    </>
  )
}

export default function AcceptTermsPage() {
  return (
    <main className="relative isolate grid min-h-svh place-items-center px-4 py-10">
      <Aurora />
      <div className="grid w-full max-w-2xl gap-5 rounded-xl bg-card p-6 shadow-pop sm:p-8">
        <Logo />
        <div className="grid gap-1">
          <h1 className="text-xl">Términos y condiciones</h1>
          <p className="text-sm text-muted-foreground">Para seguir usando FChat, lee y acepta los términos vigentes.</p>
        </div>
        <Suspense fallback={<div className="h-96" />}>
          <Content />
        </Suspense>
      </div>
    </main>
  )
}
