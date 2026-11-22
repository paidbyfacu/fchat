import type { Metadata } from "next"
import { Suspense } from "react"
import { Logo } from "@/components/mc/logo"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Entrar" }

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = (await searchParams).next
  return <LoginForm next={typeof next === "string" ? next : "/"} />
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="grid w-full max-w-sm gap-6 rounded-lg bg-card p-6 shadow-card sm:p-8">
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
