"use client"

import { useEffect, useState } from "react"
import { CheckIcon, FilmIcon, ImageIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { PickedPost } from "@/lib/wizard"
import { cn } from "@/lib/utils"

type Item = PickedPost & { kind: "post" | "reel" | "carrusel" }

async function fetchMedia(accountId: string, cursor?: string): Promise<{ items: Item[]; after?: string }> {
  const r = await fetch(`/api/instagram/media?account=${encodeURIComponent(accountId)}${cursor ? `&after=${cursor}` : ""}`)
  const body = await r.json()
  if (!r.ok) throw new Error(body.error ?? "Instagram no respondió")
  return body
}

const dateOf =(ts?: string) => (ts ? new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "")

/** Selector de posts (S06): grilla del feed propio, selección múltiple. */
export function PostPicker({
  onClose,
  accountId,
  value,
  onChange,
  max,
}: {
  onClose: () => void
  accountId: string
  value: PickedPost[]
  onChange: (posts: PickedPost[]) => void
  max: number
}) {
  // se monta al abrir (key = cuenta): el estado arranca limpio cada vez
  const [items, setItems] = useState<Item[]>([])
  const [after, setAfter] = useState<string | undefined>()
  const [state, setState] = useState<"loading" | "error" | "ready">("loading")
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<Map<string, PickedPost>>(() => new Map(value.map((p) => [p.id, p])))

  // la página actual: undefined = la primera; cambiarla dispara la carga
  const [page, setPage] = useState<{ cursor?: string; n: number }>({ n: 0 })

  useEffect(() => {
    let cancelled = false
    fetchMedia(accountId, page.cursor).then(
      (body) => {
        if (cancelled) return
        setItems((prev) => (page.cursor ? [...prev, ...body.items] : body.items))
        setAfter(body.after)
        setState("ready")
      },
      (e: Error) => {
        if (cancelled) return
        setError(e.message)
        setState("error")
      },
    )
    return () => {
      cancelled = true
    }
  }, [accountId, page])

  const load = (cursor?: string) => {
    setState("loading")
    setPage((p) => ({ cursor, n: p.n + 1 }))
  }

  function toggle(it: Item) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(it.id)) next.delete(it.id)
      else if (next.size < max) next.set(it.id, { id: it.id, caption: it.caption, thumbnail: it.thumbnail, timestamp: it.timestamp, permalink: it.permalink })
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="grid max-h-[90svh] grid-rows-[auto_1fr_auto] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Elige los posts</DialogTitle>
          <DialogDescription>
            La automatización responde solo los comentarios de los que marques. {selected.size} de {max} elegidos.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">
          {state === "error" && (
            <div className="grid justify-items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">No pude traer tus posts: {error}</p>
              <Button variant="outline" onClick={() => load()}>
                <RefreshCwIcon /> Reintentar
              </Button>
            </div>
          )}
          {state === "ready" && items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Todavía no publicaste nada en esta cuenta.</p>
          )}
          <ul role="group" aria-label="Tus posts y reels" className="grid grid-cols-3 gap-2 lg:grid-cols-4">
            {items.map((it) => {
              const on = selected.has(it.id)
              const label = `${it.kind} del ${dateOf(it.timestamp)}${it.caption ? `: ${it.caption.slice(0, 60)}` : ""}`
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={label}
                    onClick={() => toggle(it)}
                    disabled={!on && selected.size >= max}
                    className={cn(
                      "group relative block aspect-square w-full overflow-hidden rounded-sm bg-muted outline-none disabled:opacity-40",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      on && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    {it.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element -- miniaturas del CDN de Instagram, cambian de URL
                      <img src={it.thumbnail} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <ImageIcon className="m-auto size-6 text-muted-foreground" aria-hidden />
                    )}
                    <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-pill bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
                      {it.kind === "reel" && <FilmIcon className="size-3" aria-hidden />}
                      {dateOf(it.timestamp)}
                    </span>
                    {on && (
                      <span className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <CheckIcon className="size-4" aria-hidden />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {state === "loading" &&
              Array.from({ length: 8 }, (_, i) => (
                <li key={`s${i}`}>
                  <Skeleton className="aspect-square bg-muted" />
                </li>
              ))}
          </ul>
          {state === "ready" && after && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => load(after)}>
                Cargar más
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onChange([...selected.values()])
              onClose()
            }}
          >
            Usar {selected.size} {selected.size === 1 ? "post" : "posts"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
