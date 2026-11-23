"use client"

import { useActionState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createAdmin, type SetupState } from "./actions"
import { keepValues } from "@/lib/keep-values"
import { fmt } from "@/lib/i18n/locale"
import { useT } from "@/components/i18n"

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
      {error ? (
        <span role="alert" className="text-xs font-normal text-destructive">
          {error}
        </span>
      ) : (
        hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

const noop = () => () => {}

export function SetupForm({ terms }: { terms: React.ReactNode }) {
  const [state, action, pending] = useActionState<SetupState, FormData>(createAdmin, {})
  const { t: all } = useT()
  const t = all.auth
  // the browser time zone; on the server it stays empty and the action uses a default one
  const timezone = useSyncExternalStore(
    noop,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    () => "",
  )
  const err = (f: SetupState["field"]) => (state.field === f ? state.error : undefined)

  return (
    <form onSubmit={keepValues(action)} className="grid gap-4" noValidate>
      <input type="hidden" name="timezone" value={timezone} />
      <Field label={t.yourName} error={err("name")}>
        <Input name="name" autoComplete="name" required defaultValue={state.values?.name} aria-invalid={!!err("name") || undefined} autoFocus />
      </Field>
      <Field label={t.email} hint={t.emailHint} error={err("email")}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          aria-invalid={!!err("email") || undefined}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.password} hint={fmt(t.passwordHint, { n: 12 })} error={err("password")}>
          <Input name="password" type="password" autoComplete="new-password" required aria-invalid={!!err("password") || undefined} />
        </Field>
        <Field label={t.repeatPassword} error={err("confirm")}>
          <Input name="confirm" type="password" autoComplete="new-password" required aria-invalid={!!err("confirm") || undefined} />
        </Field>
      </div>

      {terms}

      <label className="flex items-start gap-3 rounded-md border border-border bg-card p-3 text-sm">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 size-4 shrink-0 accent-[var(--tk-accent)]"
          aria-invalid={!!err("terms") || undefined}
        />
        <span>
          {t.acceptBefore}
          <a href="/terminos" target="_blank" className="font-medium text-link underline underline-offset-2">
            {t.acceptLink}
          </a>
          {t.acceptAfter}
        </span>
      </label>
      {err("terms") && (
        <p role="alert" className="-mt-2 text-xs text-destructive">
          {err("terms")}
        </p>
      )}

      <Button type="submit" size="lg" loading={pending} className="w-full">
        {t.createAccount}
      </Button>
    </form>
  )
}
