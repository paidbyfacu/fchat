"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

export type Option = { value: string; label: string; hint?: string; disabled?: boolean }

/**
 * Wizard option rows: the whole row is the click target, arrow keys move
 * between rows, handled by RadioGroup, and focus is visible on the row.
 */
export function OptionGroup({
  label,
  options,
  value,
  onValueChange,
  className,
}: {
  label: string
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      className={cn("grid gap-2", className)}
    >
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "group flex cursor-pointer items-start gap-3 rounded-sm border-2 border-transparent bg-muted px-3 py-2.5 transition-colors",
            "hover:border-border has-[[data-checked]]:border-primary has-[[data-checked]]:bg-card",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
            o.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <Radio.Root
            value={o.value}
            disabled={o.disabled}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-card outline-none data-checked:border-primary"
          >
            <Radio.Indicator className="size-2 rounded-full bg-primary" />
          </Radio.Root>
          <span className="grid gap-0.5">
            <span className="text-sm font-medium">{o.label}</span>
            {o.hint && <span className="text-xs font-normal text-muted-foreground">{o.hint}</span>}
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}
