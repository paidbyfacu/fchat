"use client"

import { useActionState, useId, useState, type ReactNode } from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { saveIgAppAction, type IgAppState } from "./actions"
import { keepValues } from "@/lib/keep-values"

/** Un dato para pegar en Meta, con su botón de copiar. */
export function CopyField({ label, value, hint, secret = false }: { label: string; value: string; hint?: ReactNode; secret?: boolean }) {
  const id = useId()
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(!secret)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // sin permiso de portapapeles: se selecciona el texto para copiarlo a mano
      const el = document.getElementById(id) as HTMLInputElement | null
      el?.select()
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id={id}
            readOnly
            value={value}
            type={shown ? "text" : "password"}
            onFocus={(e) => e.currentTarget.select()}
            className={cn("font-mono text-[0.8125rem]", secret && "pr-10")}
          />
          {secret && (
            <button
              type="button"
              onClick={() => setShown((v) => !v)}
              aria-label={shown ? "Ocultar" : "Mostrar"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {shown ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
            </button>
          )}
        </div>
        <Button type="button" variant={copied ? "default" : "outline"} onClick={copy} className="shrink-0">
          {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Palabra que hay que marcar en Meta, con copiar al tocarla. */
export function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-card px-2.5 py-1 font-mono text-xs hover:bg-muted"
      aria-label={`Copiar ${value}`}
    >
      {value}
      {copied ? <CheckIcon className="size-3 text-success" aria-hidden /> : <CopyIcon className="size-3 text-muted-foreground" aria-hidden />}
    </button>
  )
}

export function IgAppForm({ savedId }: { savedId?: string }) {
  const [state, action, pending] = useActionState<IgAppState, FormData>(saveIgAppAction, {})
  const [show, setShow] = useState(false)
  const err = (f: IgAppState["field"]) => (state.field === f ? state.error : undefined)
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Identificador de la app de Instagram
          <Input
            name="appId"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Solo números"
            defaultValue={savedId}
            aria-invalid={!!err("appId") || undefined}
          />
          {err("appId") && (
            <span role="alert" className="text-xs font-normal text-destructive">
              {err("appId")}
            </span>
          )}
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Clave secreta de la app de Instagram
          <span className="relative">
            <Input
              name="appSecret"
              type={show ? "text" : "password"}
              autoComplete="off"
              placeholder={savedId ? "Guardada: pégala de nuevo para cambiarla" : "Letras y números"}
              className="pr-10"
              aria-invalid={!!err("appSecret") || undefined}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar la clave" : "Mostrar la clave"}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
            </button>
          </span>
          {err("appSecret") && (
            <span role="alert" className="text-xs font-normal text-destructive">
              {err("appSecret")}
            </span>
          )}
        </label>
      </div>
      {state.error && !state.field && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {savedId ? "Guardar los cambios" : "Guardar y seguir"}
        </Button>
        {state.ok && (
          <span role="status" className="flex items-center gap-1 text-sm text-success">
            <CheckIcon className="size-4" aria-hidden /> Guardado. Sigue con el paso siguiente.
          </span>
        )}
        <span className="text-xs text-muted-foreground">La clave se guarda cifrada en tu base de datos.</span>
      </div>
    </form>
  )
}
