"use client"

import { useActionState, useEffect, useRef } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changePassword, type PasswordState } from "./actions"
import { keepValues } from "@/lib/keep-values"

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {})
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])
  const err = (f: PasswordState["field"]) => (state.field === f ? state.error : undefined)
  const field = (name: "current" | "password" | "confirm", label: string, autoComplete: string, hint?: string) => (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input name={name} type="password" autoComplete={autoComplete} required aria-invalid={!!err(name) || undefined} />
      {err(name) ? (
        <span role="alert" className="text-xs font-normal text-destructive">
          {err(name)}
        </span>
      ) : (
        hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      )}
    </label>
  )
  return (
    <form ref={ref} onSubmit={keepValues(action)} className="grid gap-4 rounded-md bg-card p-4 shadow-card sm:p-5" noValidate>
      {field("current", "Contraseña actual", "current-password")}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("password", "Contraseña nueva", "new-password", "12 caracteres o más.")}
        {field("confirm", "Repite la contraseña nueva", "new-password")}
      </div>
      {state.error && !state.field && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          Cambiar la contraseña
        </Button>
        {state.ok && (
          <span role="status" className="flex items-center gap-1 text-sm text-success">
            <CheckIcon className="size-4" aria-hidden /> Listo. Cerramos las demás sesiones.
          </span>
        )}
      </div>
    </form>
  )
}
