"use client"

import { useActionState, useId, useState, type ReactNode } from "react"
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { saveIgAppAction, type IgAppState } from "./actions"
import { keepValues } from "@/lib/keep-values"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"

/** A value to paste in Meta, with its copy button. */
export function CopyField({ label, value, hint, secret = false }: { label: string; value: string; hint?: ReactNode; secret?: boolean }) {
  const id = useId()
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const [shown, setShown] = useState(!secret)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // no clipboard permission: select the text so it can be copied by hand
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
              aria-label={shown ? t.conectar.hide : t.conectar.show}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
            >
              {shown ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
            </button>
          )}
        </div>
        <Button type="button" variant={copied ? "default" : "outline"} onClick={copy} className="shrink-0">
          {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
          {copied ? t.common.copied : t.common.copy}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** A word to tick in Meta, copied when clicked. */
export function CopyChip({ value }: { value: string }) {
  const t = useT().t.conectar
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
      aria-label={fmt(t.copyValue, { value })}
    >
      {value}
      {copied ? <CheckIcon className="size-3 text-success" aria-hidden /> : <CopyIcon className="size-3 text-muted-foreground" aria-hidden />}
    </button>
  )
}

export function IgAppForm({ savedId }: { savedId?: string }) {
  const [state, action, pending] = useActionState<IgAppState, FormData>(saveIgAppAction, {})
  const [show, setShow] = useState(false)
  const t = useT().t.conectar
  const err = (f: IgAppState["field"]) => (state.field === f ? state.error : undefined)
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          {t.appId}
          <Input
            name="appId"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t.appIdPlaceholder}
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
          {t.appSecret}
          <span className="relative">
            <Input
              name="appSecret"
              type={show ? "text" : "password"}
              autoComplete="off"
              placeholder={savedId ? t.appSecretSaved : t.appSecretPlaceholder}
              className="pr-10"
              aria-invalid={!!err("appSecret") || undefined}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? t.hideSecret : t.showSecret}
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
          {savedId ? t.saveChanges : t.saveContinue}
        </Button>
        {state.ok && (
          <span role="status" className="flex items-center gap-1 text-sm text-success">
            <CheckIcon className="size-4" aria-hidden /> {t.saved}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{t.encrypted}</span>
      </div>
    </form>
  )
}
