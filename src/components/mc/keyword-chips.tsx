"use client"

import { useId, useRef, useState } from "react"
import { XIcon } from "lucide-react"
import { normalizeKeyword } from "@/lib/keywords"
import { cn } from "@/lib/utils"
import { fmt } from "@/lib/i18n/locale"
import { useT } from "@/components/i18n"

/**
 * Input that turns words into chips on comma or Enter. Shows what was typed;
 * duplicates are compared normalized, ignoring accents and case.
 */
export function KeywordChips({
  label,
  value,
  onChange,
  variant = "include",
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  variant?: "include" | "exclude"
  placeholder?: string
}) {
  const id = useId()
  const { t } = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState("")
  const [flash, setFlash] = useState<string | null>(null)

  function add(raw: string) {
    const words = raw.split(",").map((w) => w.trim()).filter(Boolean)
    const next = [...value]
    for (const w of words) {
      const dup = next.find((x) => normalizeKeyword(x) === normalizeKeyword(w))
      if (dup) {
        setFlash(dup)
        setTimeout(() => setFlash(null), 600)
      } else if (normalizeKeyword(w)) {
        next.push(w)
      }
    }
    onChange(next)
    setDraft("")
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-card px-2 py-1.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((w) => (
          <span
            key={w}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-sm border pr-1 pl-2 text-sm transition-colors",
              variant === "include" ? "border-border bg-muted" : "border-transparent bg-danger-subtle text-destructive",
              flash === w && "animate-pulse border-primary",
            )}
          >
            {w}
            <button
              type="button"
              aria-label={fmt(t.ui.removeChip, { word: w })}
              onClick={(e) => {
                e.stopPropagation()
                onChange(value.filter((x) => x !== w))
              }}
              className="grid size-5 place-items-center rounded-sm text-muted-foreground hover:bg-card hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={draft}
          placeholder={value.length ? "" : (placeholder ?? t.ui.chipsPlaceholder)}
          onChange={(e) => {
            if (e.target.value.includes(",")) add(e.target.value)
            else setDraft(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft && add(draft)}
          className="h-7 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
