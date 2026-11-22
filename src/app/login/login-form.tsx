"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, type LoginState } from "./actions"

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 text-sm font-medium">
        Email
        <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} autoFocus />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Contraseña
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.error) || undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </label>
      {state.error && (
        <p id="login-error" role="alert" className="rounded-sm bg-danger-subtle px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" loading={pending} className="w-full">
        Entrar
      </Button>
    </form>
  )
}
