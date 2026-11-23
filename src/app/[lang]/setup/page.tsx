import { Suspense } from "react"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { CheckIcon, MessageCircleIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "lucide-react"
import { Aurora } from "@/components/mc/aurora"
import { Logo } from "@/components/mc/logo"
import { TermsBody } from "@/components/mc/terms"
import type { Messages } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/locale"
import { rich } from "@/lib/i18n/rich"
import { TERMS } from "@/lib/terms"
import { getT, pageTitle } from "@/server/i18n"
import { needsSetup } from "@/server/setup"
import { SetupForm } from "./setup-form"

export const generateMetadata = pageTitle((t) => t.auth.setupTitle)

const steps = (t: Messages["auth"]) => [
  { icon: ShieldCheckIcon, title: t.step1Title, text: t.step1Text },
  { icon: MessageCircleIcon, title: t.step2Title, text: t.step2Text },
  { icon: ZapIcon, title: t.step3Title, text: t.step3Text },
]

function Terms({ locale, t }: { locale: Locale; t: Messages["auth"] }) {
  return (
    <div className="grid gap-3 rounded-md border border-border bg-subtle p-4">
      <p className="text-sm font-semibold">{t.beforeYouStart}</p>
      <ul className="grid gap-2">
        {TERMS[locale].highlights.map((h) => (
          <li key={h} className="flex gap-2 text-sm text-muted-foreground">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {h}
          </li>
        ))}
      </ul>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-link underline-offset-2 hover:underline">{t.readFullTerms}</summary>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-sm border border-border bg-card p-4">
          <TermsBody locale={locale} />
        </div>
      </details>
    </div>
  )
}

async function Gate({ locale, t }: { locale: Locale; t: Messages["auth"] }) {
  await connection()
  if (!(await needsSetup())) redirect("/login")
  return <SetupForm terms={<Terms locale={locale} t={t} />} />
}

export default async function SetupPage() {
  const { locale, t: all } = await getT()
  const t = all.auth
  return (
    <main className="relative isolate grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Aurora strong />
      <section className="hidden flex-col justify-between gap-10 p-10 lg:flex xl:p-14">
        <Logo size="lg" />
        <div className="grid max-w-md gap-8">
          <div className="grid gap-3">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-card/70 px-3 py-1 text-xs font-semibold text-on-brand-subtle shadow-card backdrop-blur">
              <SparklesIcon className="size-3.5" aria-hidden /> {t.threeSteps}
            </p>
            <h1 className="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight">
              {rich(t.heroTitle, { g: (c) => <span className="fc-gradient-text">{c}</span> })}
            </h1>
            <p className="text-base text-muted-foreground">
              {t.heroText}
            </p>
          </div>
          <ol className="grid gap-3">
            {steps(t).map((s, i) => (
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
        <p className="text-xs text-muted-foreground">{t.freeNoSale}</p>
      </section>

      <section className="grid place-items-center px-4 py-10 sm:px-8">
        <div className="grid w-full max-w-lg gap-6 rounded-xl bg-card p-6 shadow-pop sm:p-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="grid gap-1">
            <p className="text-xs font-semibold tracking-wide text-on-brand-subtle uppercase">{t.stepOf}</p>
            <h2 className="text-xl">{t.adminTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.adminText}</p>
          </div>
          <Suspense fallback={<div className="h-[30rem]" />}>
            <Gate locale={locale} t={t} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
