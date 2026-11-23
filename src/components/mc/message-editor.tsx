"use client"

import { useId } from "react"
import { ArrowDownIcon, ArrowUpIcon, InfoIcon, PlusIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CountedTextarea } from "@/components/mc/counted-textarea"
import { LIMITS, type Message, type MessageButton, isValidUrl, messageIssues } from "@/lib/message"
import { cn } from "@/lib/utils"
import type { Messages } from "@/lib/i18n"
import { fmt } from "@/lib/i18n/locale"
import { useT } from "@/components/i18n"

type T = Messages["ui"]

const typeLabel = (t: T): Record<MessageButton["type"], string> => ({
  postback: t.typeReply,
  url: t.typeLink,
  profile: t.typeProfile,
})

function newButton(type: MessageButton["type"], t: T): MessageButton {
  const id = Math.random().toString(36).slice(2, 8)
  if (type === "url") return { id, type, title: t.newLinkButton, url: "https://", track: true }
  if (type === "profile") return { id, type, title: t.typeProfile }
  return { id, type, title: t.newReplyButton }
}

export function MessageEditor({
  label,
  value,
  onChange,
  isFirst = false,
}: {
  label: string
  value: Message
  onChange: (m: Message) => void
  /** First message after a comment: it always goes out as a private reply. */
  isFirst?: boolean
}) {
  const switchId = useId()
  const { locale, t: all } = useT()
  const t = all.ui
  const TYPE_LABEL = typeLabel(t)
  const { errors, warnings } = messageIssues(value, { isFirst, locale })
  const set = (patch: Partial<Message>) => onChange({ ...value, ...patch })
  const setButton = (i: number, b: MessageButton) => set({ buttons: value.buttons.map((x, j) => (j === i ? b : x)) })
  const move = (i: number, d: -1 | 1) => {
    const next = [...value.buttons]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    set({ buttons: next })
  }

  return (
    <fieldset className="grid gap-4 rounded-md bg-card p-4 shadow-card">
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg">{label}</h3>
        <div className="flex items-center gap-2">
          <label htmlFor={switchId} className="text-xs text-muted-foreground">
            {t.privateReply}
          </label>
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Switch
                id={switchId}
                checked={isFirst || value.privateReply}
                disabled={isFirst}
                onCheckedChange={(v) => set({ privateReply: v })}
              />
            </TooltipTrigger>
            {isFirst && (
              <TooltipContent>{t.privateReplyTip}</TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      <CountedTextarea label={t.text} value={value.text} onChange={(text) => set({ text })} max={LIMITS.text} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t.buttons}</span>
          <span className="text-xs text-muted-foreground">
            {value.buttons.length} / {LIMITS.buttons}
          </span>
        </div>
        {value.buttons.map((b, i) => {
          const urlBad = b.type === "url" && !isValidUrl(b.url)
          return (
            <div key={b.id} className="grid gap-2 rounded-sm border border-border p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-muted px-2 py-0.5 text-xs font-medium">{TYPE_LABEL[b.type]}</span>
                <span className="ml-auto flex gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label={t.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t.moveDown}
                    disabled={i === value.buttons.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={fmt(t.removeButton, { title: b.title })}
                    onClick={() => set({ buttons: value.buttons.filter((_, j) => j !== i) })}
                  >
                    <Trash2Icon />
                  </Button>
                </span>
              </div>
              <Input
                aria-label={t.buttonText}
                value={b.title}
                onChange={(e) => setButton(i, { ...b, title: e.target.value })}
              />
              {b.type === "url" && (
                <>
                  <Input
                    aria-label="URL"
                    value={b.url}
                    aria-invalid={urlBad || undefined}
                    onChange={(e) => setButton(i, { ...b, url: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch size="sm" checked={b.track} onCheckedChange={(track) => setButton(i, { ...b, track })} />
                    {t.countClicks}
                  </label>
                </>
              )}
            </div>
          )
        })}
        {value.buttons.length < LIMITS.buttons && (
          <div className="flex flex-wrap gap-2">
            {(["postback", "url", "profile"] as const).map((k) => (
              <Button key={k} size="sm" variant="outline" onClick={() => set({ buttons: [...value.buttons, newButton(k, t)] })}>
                <PlusIcon /> {TYPE_LABEL[k]}
              </Button>
            ))}
          </div>
        )}
      </div>

      {(errors.length > 0 || warnings.length > 0) && (
        <ul className="grid gap-1.5" aria-live="polite">
          {errors.map((e) => (
            <li key={e} className="flex gap-2 rounded-sm bg-danger-subtle px-3 py-2 text-xs text-destructive">
              <TriangleAlertIcon className="size-4 shrink-0" aria-hidden /> {e}
            </li>
          ))}
          {warnings.map((w) => (
            <li key={w} className={cn("flex gap-2 rounded-sm bg-warning-subtle px-3 py-2 text-xs text-warning")}>
              <InfoIcon className="size-4 shrink-0" aria-hidden /> {w}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
