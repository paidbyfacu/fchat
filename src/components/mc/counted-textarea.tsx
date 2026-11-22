"use client"

import { useId } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

/** Área de texto con contador. Avisa al pasarse del máximo, no corta lo que escribiste. */
export function CountedTextarea({
  label,
  value,
  onChange,
  max,
  placeholder,
  hint,
  error,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}) {
  const id = useId()
  const over = value.length > max
  const message = error ?? (over ? `Instagram acepta hasta ${max} caracteres.` : undefined)
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span
          className={cn("text-xs tabular-nums", over ? "font-semibold text-destructive" : "text-muted-foreground")}
          aria-live="polite"
        >
          {value.length} / {max}
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(message) || undefined}
        aria-describedby={message || hint ? `${id}-msg` : undefined}
      />
      {(message || hint) && (
        <p id={`${id}-msg`} className={cn("text-xs", message ? "text-destructive" : "text-muted-foreground")}>
          {message ?? hint}
        </p>
      )}
    </div>
  )
}
