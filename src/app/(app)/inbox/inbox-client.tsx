"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { BellIcon, CheckIcon, ChevronDownIcon, CircleCheckBigIcon, RotateCcwIcon, SendIcon, StarIcon, StickyNoteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { addNote, markRead, sendReply, setConversationStatus, setReminder, toggleStar } from "./actions"

/** Vuelve a pedir la bandeja cada pocos segundos mientras la pestaña está a la vista. */
export function AutoRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, every)
    const onFocus = () => router.refresh()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener("focus", onFocus)
    }
  }, [router, every])
  return null
}

/** Al abrir una conversación con mensajes sin leer, la marca como leída. */
export function MarkRead({ id, needed }: { id: string; needed: boolean }) {
  useEffect(() => {
    if (needed) void markRead(id).catch(() => {})
  }, [id, needed])
  return null
}

export type MenuItem = { label: string; href?: string; active?: boolean; disabled?: boolean; hint?: string }

/** Menú desplegable de filtros: cada opción es un link con los filtros nuevos en la URL. */
export function FilterMenu({ label, items, className }: { label: string; items: MenuItem[]; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 items-center gap-1 rounded-sm px-2 text-sm font-medium text-foreground hover:bg-muted aria-expanded:bg-muted",
          className,
        )}
      >
        {label}
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((it) =>
          it.disabled || !it.href ? (
            <DropdownMenuItem key={it.label} disabled>
              <span className="flex-1">{it.label}</span>
              {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={it.label} render={<Link href={it.href} />}>
              <span className="flex-1">{it.label}</span>
              {it.active && <CheckIcon className="text-primary" aria-hidden />}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Baja hasta el último mensaje al abrir y cuando llega uno nuevo, salvo que estés leyendo más arriba. */
export function ScrollToEnd({ count, children, className }: { count: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (first.current || near) el.scrollTop = el.scrollHeight
    first.current = false
  }, [count])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function ConversationActions({
  id,
  starred,
  status,
  remindAt,
}: {
  id: string
  starred: boolean
  status: "open" | "closed"
  remindAt: string | null
}) {
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<unknown>) => start(async () => void (await fn()))
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={starred}
        aria-label={starred ? "Quitar de favoritos" : "Marcar como favorito"}
        onClick={() => run(() => toggleStar(id))}
        disabled={pending}
      >
        <StarIcon className={cn(starred && "fill-current text-[#e5a50a]")} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={remindAt ? `Recordatorio: ${remindAt}` : "Poner un recordatorio"} disabled={pending} />
          }
        >
          <BellIcon className={cn(remindAt && "fill-current text-primary")} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {remindAt && (
            <>
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Te lo recuerdo {remindAt}</p>
              <DropdownMenuSeparator />
            </>
          )}
          {[
            { label: "En 1 hora", h: 1 },
            { label: "En 3 horas", h: 3 },
            { label: "Mañana", h: 24 },
            { label: "En 3 días", h: 72 },
            { label: "En una semana", h: 168 },
          ].map((o) => (
            <DropdownMenuItem key={o.h} onClick={() => run(() => setReminder(id, o.h))}>
              {o.label}
            </DropdownMenuItem>
          ))}
          {remindAt && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => run(() => setReminder(id, null))}>Quitar el recordatorio</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {status === "open" ? (
        <Button variant="outline" size="sm" onClick={() => run(() => setConversationStatus(id, "closed"))} loading={pending}>
          <CircleCheckBigIcon aria-hidden /> <span className="hidden sm:inline">Cerrar chat</span>
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => run(() => setConversationStatus(id, "open"))} loading={pending}>
          <RotateCcwIcon aria-hidden /> <span className="hidden sm:inline">Reabrir</span>
        </Button>
      )}
    </div>
  )
}

/** Caja de abajo con dos pestañas: Responder por Instagram o dejar una Nota interna. */
export function InboxComposer({ id, hoursLeft, name }: { id: string; hoursLeft: number | null; name: string }) {
  const [tab, setTab] = useState<"reply" | "note">("reply")
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const closed = hoursLeft === null
  const blocked = tab === "reply" && closed

  const submit = () => {
    const value = text.trim()
    if (!value || blocked || pending) return
    setError(null)
    start(async () => {
      const r = tab === "reply" ? await sendReply(id, value) : await addNote(id, value)
      if (r.ok) setText("")
      else setError(r.error)
    })
  }

  return (
    <form
      className={cn("border-t border-border bg-card", tab === "note" && "bg-[#fffbea]")}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div role="tablist" aria-label="Tipo de mensaje" className="flex gap-1 px-3 pt-2">
        {(
          [
            { v: "reply", label: "Responder", icon: SendIcon },
            { v: "note", label: "Nota", icon: StickyNoteIcon },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            type="button"
            role="tab"
            aria-selected={tab === t.v}
            onClick={() => {
              setTab(t.v)
              setError(null)
            }}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              tab === t.v && "bg-muted text-foreground",
            )}
          >
            <t.icon className="size-3.5" aria-hidden /> {t.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {tab === "note" ? "Solo la ves tú" : closed ? "Ventana de 24 h cerrada" : `Puedes responder durante ${hoursLeft} h más`}
        </span>
      </div>
      <div className="flex items-end gap-2 p-3">
        <Textarea
          aria-label={tab === "reply" ? `Respuesta para ${name}` : "Nota interna"}
          value={text}
          disabled={blocked}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={
            blocked
              ? "Instagram solo deja responder dentro de las 24 h desde su último mensaje. Cuando te vuelva a escribir, se reabre."
              : tab === "reply"
                ? "Escribe tu respuesta. Enter envía, Shift + Enter hace un salto de línea."
                : "Escribe una nota para recordar algo de esta persona."
          }
          className="max-h-40 min-h-11 resize-none bg-card"
        />
        <Button type="submit" disabled={blocked || !text.trim()} loading={pending}>
          {tab === "reply" ? "Enviar" : "Guardar nota"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="px-3 pb-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
