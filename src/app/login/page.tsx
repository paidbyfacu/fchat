import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { needsSetup } from "@/server/setup"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Entrar" }

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  await connection()
  // instalación nueva, sin ningún usuario: primero se crea la cuenta de administrador
  if (await needsSetup()) redirect("/setup")
  const next = (await searchParams).next
  return <LoginForm next={typeof next === "string" ? next : "/"} />
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="relative isolate grid min-h-svh place-items-center px-4">
      <Aurora strong />
      <div className="grid w-full max-w-sm gap-6 rounded-xl bg-card p-6 shadow-pop sm:p-8">
        <Logo />
        <div className="grid gap-1">
          <h1 className="text-xl">Entrar</h1>
          <p className="text-sm text-muted-foreground">Tus automatizaciones de Instagram.</p>
        </div>
        <Suspense fallback={<div className="h-56" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
