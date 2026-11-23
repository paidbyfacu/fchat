"use client"

import { useState } from "react"
import { SendIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { fmt } from "@/lib/i18n/locale"
import { useT } from "@/components/i18n"

export function ConversationItem({
  name,
  preview,
  time,
  unread,
  hoursLeft,
  active,
  href = "#",
}: {
  name: string
  preview: string
  time: string
  unread: number
  hoursLeft: number | null
  active?: boolean
  href?: string
}) {
  const { t } = useT()
  return (
    <a
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex gap-3 rounded-sm px-3 py-2.5 transition-colors hover:bg-muted",
        active && "bg-muted",
      )}
    >
      <Avatar className="size-8">
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate", unread ? "font-semibold" : "font-medium")}>{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
        </span>
        <span className="truncate text-xs text-muted-foreground">{preview}</span>
        <span className="flex items-center justify-between gap-2">
          <span className={cn("text-xs", hoursLeft === null ? "text-muted-foreground" : "text-success")}>
            {hoursLeft === null ? t.ui.windowClosed : fmt(t.ui.windowOpen, { h: hoursLeft })}
          </span>
          {unread > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              <span className="sr-only">{t.ui.unreadSr}</span>
              {unread}
            </span>
          )}
        </span>
      </span>
    </a>
  )
}

export function Composer({ hoursLeft, onSend }: { hoursLeft: number | null; onSend?: (text: string) => Promise<void> }) {
  const { t } = useT()
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const closed = hoursLeft === null
  return (
    <form
      className="grid gap-2 rounded-md border border-border bg-card p-3"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!text.trim() || closed) return
        setSending(true)
        try {
          await onSend?.(text)
          setText("")
        } finally {
          setSending(false)
        }
      }}
    >
      {closed && (
        <p className="text-xs text-muted-foreground" id="composer-closed">
          {t.ui.composerClosed}
        </p>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          aria-label={t.ui.message}
          aria-describedby={closed ? "composer-closed" : undefined}
          value={text}
          disabled={closed}
          onChange={(e) => setText(e.target.value)}
          placeholder={closed ? t.ui.windowClosed : t.ui.writeReply}
          className="min-h-10"
        />
        <Button type="submit" disabled={closed || !text.trim()} loading={sending} aria-label={t.ui.send}>
          <SendIcon />
        </Button>
      </div>
    </form>
  )
}
