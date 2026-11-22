"use client"

import { useState } from "react"
import { ExternalLinkIcon, HeartIcon, UserIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Message } from "@/lib/message"

type View = "post" | "comments" | "dm"

/**
 * Vista previa dibujada (no es una captura de Instagram). Se actualiza al
 * escribir. El dibujo es aria-hidden; el resumen en texto lo lee el lector.
 */
export function PhonePreview({
  username,
  comment,
  messages,
}: {
  username: string
  comment: string
  messages: Message[]
}) {
  const [view, setView] = useState<View>("dm")
  const summary =
    view === "dm"
      ? `Vista previa del DM: ${messages.map((m) => m.text).join(" / ") || "sin mensajes"}`
      : view === "comments"
        ? `Vista previa del comentario: «${comment}»`
        : "Vista previa del post"

  return (
    <div className="grid justify-items-center gap-4">
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
      <div
        aria-hidden
        className="flex h-[560px] w-[300px] flex-col overflow-hidden rounded-phone border-[6px] border-phone bg-phone text-on-phone shadow-phone"
      >
        <div className="mx-auto mt-2 h-1.5 w-20 rounded-pill bg-bubble-in" />
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="grid size-7 place-items-center rounded-full bg-bubble-in">
            <UserIcon className="size-4 text-on-phone-muted" />
          </div>
          <span className="text-xs font-semibold">{username}</span>
        </div>

        {view === "post" && (
          <div className="grid flex-1 place-items-center bg-gradient-to-br from-bubble-in to-phone text-xs text-on-phone-muted">
            Tu post o reel
          </div>
        )}

        {view === "comments" && (
          <div className="flex-1 space-y-4 p-4 text-xs">
            <div className="flex gap-2">
              <div className="size-7 shrink-0 rounded-full bg-bubble-in" />
              <div className="flex-1">
                <p>
                  <span className="font-semibold">alguien</span> <span className="text-on-phone-muted">ahora</span>
                </p>
                <p>{comment}</p>
                <p className="mt-1 text-on-phone-muted">Responder</p>
              </div>
              <HeartIcon className="size-3.5 text-on-phone-muted" />
            </div>
          </div>
        )}

        {view === "dm" && (
          <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden p-3 text-[13px] leading-snug">
            {messages.length === 0 && <p className="m-auto text-xs text-on-phone-muted">Escribe tu primer mensaje</p>}
            {messages.map((m, i) => {
              // el toque de la persona: el primer botón de respuesta, si hay un mensaje después
              const tap = i < messages.length - 1 ? m.buttons.find((b) => b.type === "postback") : undefined
              return (
                <div key={i} className="contents">
                  <div className="grid max-w-[85%] gap-1">
                    <div className="rounded-2xl rounded-bl-md bg-bubble-in px-3 py-2 whitespace-pre-wrap text-on-bubble">
                      {m.text || "…"}
                    </div>
                    {m.buttons.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-center gap-1 rounded-xl bg-bubble-in px-3 py-2 text-center font-semibold text-on-bubble"
                      >
                        {b.title || "Botón"}
                        {b.type === "url" && <ExternalLinkIcon className="size-3" />}
                      </div>
                    ))}
                  </div>
                  {tap && (
                    <div className="max-w-[70%] self-end rounded-2xl rounded-br-md bg-bubble-out px-3 py-2 text-on-bubble">
                      {tap.title}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="m-3 rounded-pill border border-white/15 px-4 py-2 text-xs text-on-phone-muted">Mensaje…</div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label="Qué ver en la vista previa">
          <TabsTrigger value="post">Post</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="dm">DM</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
