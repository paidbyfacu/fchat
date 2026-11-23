"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react"
import { BellIcon, CheckIcon, ChevronDownIcon, CircleCheckBigIcon, RotateCcwIcon, SendIcon, StarIcon, StickyNoteIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"
import { addNote, markRead, sendReply, setConversationStatus, setReminder, toggleStar } from "./actions"

/** Fetches the inbox again every few seconds while the tab is visible. */
export function AutoRefresh({ every = 8000 }: { every?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, every)
    const onFocus = () => router.refresh()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(t)
      window.removeEventListener("focus", onFocus)
    }
  }, [router, every])
  return null
}

/** When a conversation with unread messages opens, marks it as read. */
export function MarkRead({ id, needed }: { id: string; needed: boolean }) {
  useEffect(() => {
    if (needed) void markRead(id).catch(() => {})
  }, [id, needed])
  return null
}

export type MenuItem = { label: string; href?: string; active?: boolean; disabled?: boolean; hint?: string }

/** Filter dropdown: each option is a link with the new filters in the URL. */
export function FilterMenu({ label, items, className }: { label: string; items: MenuItem[]; className?: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 items-center gap-1 rounded-sm px-2 text-sm font-medium text-foreground hover:bg-muted aria-expanded:bg-muted",
          className,
        )}
      >
        {label}
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {items.map((it) =>
          it.disabled || !it.href ? (
            <DropdownMenuItem key={it.label} disabled>
              <span className="flex-1">{it.label}</span>
              {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={it.label} render={<Link href={it.href} />}>
              <span className="flex-1">{it.label}</span>
              {it.active && <CheckIcon className="text-primary" aria-hidden />}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Scrolls to the last message on open and when a new one arrives, unless you are reading further up. */
export function ScrollToEnd({ count, children, className }: { count: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 160
    if (first.current || near) el.scrollTop = el.scrollHeight
    first.current = false
  }, [count])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function ConversationActions({
  id,
  starred,
  status,
  remindAt,
}: {
  id: string
  starred: boolean
  status: "open" | "closed"
  remindAt: string | null
}) {
  const [pending, start] = useTransition()
  const t = useT().t.inbox
  const run = (fn: () => Promise<unknown>) => start(async () => void (await fn()))
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={starred}
        aria-label={starred ? t.unstar : t.star}
        onClick={() => run(() => toggleStar(id))}
        disabled={pending}
      >
        <StarIcon className={cn(starred && "fill-current text-[#e5a50a]")} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={remindAt ? fmt(t.reminderAt, { at: remindAt }) : t.setReminder} disabled={pending} />
          }
        >
          <BellIcon className={cn(remindAt && "fill-current text-primary")} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {remindAt && (
            <>
              <p className="px-2 py-1.5 text-xs text-muted-foreground">{fmt(t.remindYou, { at: remindAt })}</p>
              <DropdownMenuSeparator />
            </>
          )}
          {[
            { label: t.in1h, h: 1 },
            { label: t.in3h, h: 3 },
            { label: t.tomorrow, h: 24 },
            { label: t.in3d, h: 72 },
            { label: t.in1w, h: 168 },
          ].map((o) => (
            <DropdownMenuItem key={o.h} onClick={() => run(() => setReminder(id, o.h))}>
              {o.label}
            </DropdownMenuItem>
          ))}
          {remindAt && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => run(() => setReminder(id, null))}>{t.removeReminder}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {status === "open" ? (
        <Button variant="outline" size="sm" onClick={() => run(() => setConversationStatus(id, "closed"))} loading={pending}>
          <CircleCheckBigIcon aria-hidden /> <span className="hidden sm:inline">{t.closeChat}</span>
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => run(() => setConversationStatus(id, "open"))} loading={pending}>
          <RotateCcwIcon aria-hidden /> <span className="hidden sm:inline">{t.reopen}</span>
        </Button>
      )}
    </div>
  )
}

/** Bottom box with two tabs: Reply on Instagram or leave an internal Note. */
export function InboxComposer({ id, hoursLeft, name }: { id: string; hoursLeft: number | null; name: string }) {
  const t = useT().t.inbox
  const [tab, setTab] = useState<"reply" | "note">("reply")
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const closed = hoursLeft === null
  const blocked = tab === "reply" && closed

  const submit = () => {
    const value = text.trim()
    if (!value || blocked || pending) return
    setError(null)
    start(async () => {
      const r = tab === "reply" ? await sendReply(id, value) : await addNote(id, value)
      if (r.ok) setText("")
      else setError(r.error)
    })
  }

  return (
    <form
      className={cn("border-t border-border bg-card", tab === "note" && "bg-[#fffbea]")}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div role="tablist" aria-label={t.messageType} className="flex gap-1 px-3 pt-2">
        {(
          [
            { v: "reply", label: t.reply, icon: SendIcon },
            { v: "note", label: t.noteTab, icon: StickyNoteIcon },
          ] as const
        ).map((tb) => (
          <button
            key={tb.v}
            type="button"
            role="tab"
            aria-selected={tab === tb.v}
            onClick={() => {
              setTab(tb.v)
              setError(null)
            }}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              tab === tb.v && "bg-muted text-foreground",
            )}
          >
            <tb.icon className="size-3.5" aria-hidden /> {tb.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {tab === "note" ? t.onlyYou : closed ? t.window24Closed : fmt(t.canReplyFor, { h: hoursLeft })}
        </span>
      </div>
      <div className="flex items-end gap-2 p-3">
        <Textarea
          aria-label={tab === "reply" ? fmt(t.replyFor, { name }) : t.note}
          value={text}
          disabled={blocked}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={
            blocked
              ? t.blockedPlaceholder
              : tab === "reply"
                ? t.replyPlaceholder
                : t.notePlaceholder
          }
          className="max-h-40 min-h-11 resize-none bg-card"
        />
        <Button type="submit" disabled={blocked || !text.trim()} loading={pending}>
          {tab === "reply" ? t.send : t.saveNote}
        </Button>
      </div>
      {error && (
        <p role="alert" className="px-3 pb-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
