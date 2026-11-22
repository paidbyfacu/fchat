import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { CheckIcon, MessageCircleIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { TERMS_HIGHLIGHTS, TermsBody } from "@/components/mc/terms"
import { needsSetup } from "@/server/setup"
import { SetupForm } from "./setup-form"

export const metadata: Metadata = { title: "Instalación" }

const STEPS = [
  { icon: ShieldCheckIcon, title: "Crea tu cuenta", text: "La cuenta de administrador de tu FChat." },
  { icon: MessageCircleIcon, title: "Vincula tus redes", text: "Conecta Instagram con una guía paso a paso." },
  { icon: ZapIcon, title: "Crea tu primera automatización", text: "Comentan una palabra y reciben tu link por DM." },
]

function Terms() {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-subtle p-4">
      <p className="text-sm font-semibold">Antes de empezar</p>
      <ul className="grid gap-2">
        {TERMS_HIGHLIGHTS.map((t) => (
          <li key={t} className="flex gap-2 text-sm text-muted-foreground">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {t}
          </li>
        ))}
      </ul>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-link underline-offset-2 hover:underline">Leer los términos completos</summary>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-sm border border-border bg-card p-4">
          <TermsBody />
        </div>
      </details>
    </div>
  )
}

async function Gate() {
  await connection()
  if (!(await needsSetup())) redirect("/login")
  return <SetupForm terms={<Terms />} />
}

export default function SetupPage() {
  return (
    <main className="relative isolate grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Aurora strong />
      <section className="hidden flex-col justify-between gap-10 p-10 lg:flex xl:p-14">
        <Logo size="lg" />
        <div className="grid max-w-md gap-8">
          <div className="grid gap-3">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-card/70 px-3 py-1 text-xs font-semibold text-on-brand-subtle shadow-card backdrop-blur">
              <SparklesIcon className="size-3.5" aria-hidden /> Instalación en 3 pasos
            </p>
            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight">
              Tus DM de Instagram, <span className="fc-gradient-text">en piloto automático</span>.
            </h1>
            <p className="text-base text-muted-foreground">
              Alguien comenta una palabra en tu reel y le llega tu link por mensaje directo, al instante. En tu propio servidor.
            </p>
          </div>
          <ol className="grid gap-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3 rounded-lg bg-card/70 p-3 shadow-card backdrop-blur">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-on-brand-subtle">
                  <s.icon className="size-4" aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">
                    {i + 1}. {s.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-muted-foreground">Gratis y de código abierto. Prohibida su venta.</p>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="grid w-full max-w-lg gap-6 rounded-xl bg-card p-6 shadow-pop sm:p-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="grid gap-1">
            <p className="text-xs font-semibold tracking-wide text-on-brand-subtle uppercase">Paso 1 de 3</p>
            <h2 className="text-xl">Crea tu cuenta de administrador</h2>
            <p className="text-sm text-muted-foreground">Es la cuenta con la que vas a entrar a este panel. Guarda bien la contraseña.</p>
          </div>
          <Suspense fallback={<div className="h-[30rem]" />}>
            <Gate />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
