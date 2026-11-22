import type { Metadata } from "next"
import Link from "next/link"
import type { ComponentType } from "react"
import { BarChart3Icon, ClockIcon, ListOrderedIcon, MousePointerClickIcon, SendIcon, TimerIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Banner } from "@/components/mc/feedback"
import { Page, PageHeader } from "@/components/mc/page-header"
import { cn } from "@/lib/utils"
import { AutomationTabs } from "../automation-tabs"

export const metadata: Metadata = { title: "Secuencias" }

const HOW: { icon: ComponentType<{ className?: string }>; title: string; text: string }[] = [
  {
    icon: MousePointerClickIcon,
    title: "Elige quién entra",
    text: "Quien toca un botón de tu DM, quien comenta una palabra o quien te escribe. Cada persona entra una sola vez.",
  },
  {
    icon: ListOrderedIcon,
    title: "Arma los mensajes y las esperas",
    text: "Escribe cada mensaje con sus botones y elige cuánto esperar antes del siguiente: minutos u horas.",
  },
  {
    icon: BarChart3Icon,
    title: "Actívala y mira cómo rinde",
    text: "Para cada mensaje ves cuántos salieron, cuántos se leyeron y cuántos tocaron el botón.",
  },
]

type Item = { kind: "start" | "message" | "wait"; title: string; text?: string; when?: string; stats?: string }

const PREVIEW: Item[] = [
  { kind: "start", title: "Entra a la secuencia", text: "Toca «Quiero la guía» en tu DM" },
  { kind: "message", title: "Mensaje 1", when: "Al instante", text: "¡Aquí tienes la guía! 👇 Toca el botón para abrirla.", stats: "Enviados 1.240 · Clics 61%" },
  { kind: "wait", title: "Espera 3 horas" },
  { kind: "message", title: "Mensaje 2", when: "A las 3 horas", text: "¿Pudiste verla? Te dejo el video con el paso a paso.", stats: "Enviados 1.180 · Clics 34%" },
  { kind: "wait", title: "Espera 18 horas" },
  { kind: "message", title: "Mensaje 3", when: "A las 21 horas", text: "Último aviso: hoy cierra el cupo del taller. ¿Te guardo un lugar?", stats: "Enviados 1.010 · Clics 22%" },
]

function Timeline() {
  return (
    <ol className="relative grid gap-3 before:absolute before:top-4 before:bottom-4 before:left-[1.0625rem] before:w-0.5 before:bg-border">
      {PREVIEW.map((it, i) => (
        <li key={i} className="relative flex gap-3">
          <span
            className={cn(
              "z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-card",
              it.kind === "start" && "bg-primary text-primary-foreground",
              it.kind === "message" && "bg-brand-subtle text-on-brand-subtle",
              it.kind === "wait" && "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            {it.kind === "start" ? (
              <MousePointerClickIcon className="size-4" />
            ) : it.kind === "message" ? (
              <SendIcon className="size-4" />
            ) : (
              <TimerIcon className="size-4" />
            )}
          </span>
          {it.kind === "wait" ? (
            <span className="self-center text-sm font-medium text-muted-foreground">{it.title}</span>
          ) : (
            <span className="grid min-w-0 flex-1 gap-1 rounded-md bg-card p-3 shadow-card">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-semibold">{it.title}</span>
                {it.when && <span className="text-xs text-muted-foreground">{it.when}</span>}
              </span>
              {it.text && <span className="text-sm text-muted-foreground">{it.text}</span>}
              {it.stats && <span className="text-xs font-medium text-success">{it.stats}</span>}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export default function SequencesPage() {
  return (
    <Page>
      <PageHeader title="Automatizaciones" description="Qué pasa cuando alguien comenta o te escribe." />
      <AutomationTabs current="/automations/secuencias" />

      <section className="relative grid gap-8 overflow-hidden rounded-lg bg-card p-5 shadow-card sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-5">
          <div className="grid gap-3">
            <span className="w-fit rounded-pill bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Próximamente</span>
            <h2 className="text-display leading-tight">
              <span className="fc-gradient-text">Secuencias</span> de mensajes
            </h2>
            <p className="text-muted-foreground">
              Una secuencia es una serie de mensajes que salen solos, uno detrás de otro, con la espera que elijas entre cada uno. Sirve
              para acompañar a quien pidió tu link: mandarle el recurso, recordárselo y ofrecerle lo siguiente.
            </p>
          </div>
          <ol className="grid gap-3">
            {HOW.map((h, i) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-subtle text-on-brand-subtle">
                  <h.icon className="size-4" aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">
                    {i + 1}. {h.title}
                  </span>
                  <span className="text-sm text-muted-foreground">{h.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="grid content-start gap-3 rounded-lg bg-subtle p-4 sm:p-5">
          <p className="flex items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
            Así se va a ver
            <span className="rounded-pill bg-card px-2 py-0.5 font-medium">Ejemplo</span>
          </p>
          <Timeline />
        </div>
      </section>

      <Banner tone="info" title="La regla de las 24 horas de Instagram">
        Instagram deja escribirle a alguien solo dentro de las 24 horas desde su último mensaje o el último botón que tocó. Por eso, en
        Instagram cada secuencia termina dentro de esa ventana, y cada botón que la persona toca la vuelve a abrir por 24 horas más. El
        editor te va a marcar qué mensajes quedan fuera.
      </Banner>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-card p-5 shadow-card">
        <span className="flex items-start gap-3">
          <ClockIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="grid gap-0.5">
            <span className="font-semibold">Mientras tanto</span>
            <span className="text-sm text-muted-foreground">
              La plantilla de comentarios a DM ya manda tu link con botón y pide que te sigan. Las secuencias llegan en una próxima
              versión y se instalan solas.
            </span>
          </span>
        </span>
        <Link href="/automations/plantillas" className={buttonVariants()}>
          Ver las plantillas
        </Link>
      </section>
    </Page>
  )
}
