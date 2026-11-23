import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { getT, pageTitle } from "@/server/i18n"
import { needsSetup } from "@/server/setup"
import { LoginForm } from "./login-form"

export const generateMetadata = pageTitle((t) => t.auth.loginTitle)

async function Form({ searchParams }: { searchParams: PageProps<"/[lang]/login">["searchParams"] }) {
  await connection()
  // fresh installation with no users: the administrator account comes first
  if (await needsSetup()) redirect("/setup")
  const next = (await searchParams).next
  return <LoginForm next={typeof next === "string" ? next : "/"} />
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/login">) {
  const { t } = await getT()
  return (
    <main className="relative isolate grid min-h-svh place-items-center px-4">
      <Aurora strong />
      <div className="grid w-full max-w-sm gap-6 rounded-xl bg-card p-6 shadow-pop sm:p-8">
        <Logo />
        <div className="grid gap-1">
          <h1 className="text-xl">{t.auth.loginTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
        </div>
        <Suspense fallback={<div className="h-56" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
