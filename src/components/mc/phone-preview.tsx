"use client"

import { useState } from "react"
import { ExternalLinkIcon, HeartIcon, UserIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Message } from "@/lib/message"
import { fmt } from "@/lib/i18n/locale"
import { useT } from "@/components/i18n"

type View = "post" | "comments" | "dm"

/**
 * Drawn preview, not an Instagram screenshot. It updates while typing.
 * The drawing is aria-hidden; screen readers read the text summary.
 */
export function PhonePreview({
  username,
  comment,
  messages,
}: {
  username: string
  comment: string
  messages: Message[]
}) {
  const [view, setView] = useState<View>("dm")
  const { t: all } = useT()
  const t = all.ui
  const summary =
    view === "dm"
      ? fmt(t.previewDm, { text: messages.map((m) => m.text).join(" / ") || t.noMessages })
      : view === "comments"
        ? fmt(t.previewComment, { comment })
        : t.previewPost

  return (
    <div className="grid justify-items-center gap-4">
      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
      <div
        aria-hidden
        className="flex h-[560px] w-[300px] flex-col overflow-hidden rounded-phone border-[6px] border-phone bg-phone text-on-phone shadow-phone"
      >
        <div className="mx-auto mt-2 h-1.5 w-20 rounded-pill bg-bubble-in" />
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div className="grid size-7 place-items-center rounded-full bg-bubble-in">
            <UserIcon className="size-4 text-on-phone-muted" />
          </div>
          <span className="text-xs font-semibold">{username}</span>
        </div>

        {view === "post" && (
          <div className="grid flex-1 place-items-center bg-gradient-to-br from-bubble-in to-phone text-xs text-on-phone-muted">
            {t.yourPost}
          </div>
        )}

        {view === "comments" && (
          <div className="flex-1 space-y-4 p-4 text-xs">
            <div className="flex gap-2">
              <div className="size-7 shrink-0 rounded-full bg-bubble-in" />
              <div className="flex-1">
                <p>
                  <span className="font-semibold">{t.someone}</span> <span className="text-on-phone-muted">{t.now}</span>
                </p>
                <p>{comment}</p>
                <p className="mt-1 text-on-phone-muted">{t.reply}</p>
              </div>
              <HeartIcon className="size-3.5 text-on-phone-muted" />
            </div>
          </div>
        )}

        {view === "dm" && (
          <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden p-3 text-[13px] leading-snug">
            {messages.length === 0 && <p className="m-auto text-xs text-on-phone-muted">{t.writeFirst}</p>}
            {messages.map((m, i) => {
              // the person's tap: the first reply button, if a message follows
              const tap = i < messages.length - 1 ? m.buttons.find((b) => b.type === "postback") : undefined
              return (
                <div key={i} className="contents">
                  <div className="grid max-w-[85%] gap-1">
                    <div className="rounded-2xl rounded-bl-md bg-bubble-in px-3 py-2 whitespace-pre-wrap text-on-bubble">
                      {m.text || "…"}
                    </div>
                    {m.buttons.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-center gap-1 rounded-xl bg-bubble-in px-3 py-2 text-center font-semibold text-on-bubble"
                      >
                        {b.title || t.button}
                        {b.type === "url" && <ExternalLinkIcon className="size-3" />}
                      </div>
                    ))}
                  </div>
                  {tap && (
                    <div className="max-w-[70%] self-end rounded-2xl rounded-br-md bg-bubble-out px-3 py-2 text-on-bubble">
                      {tap.title}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="m-3 rounded-pill border border-white/15 px-4 py-2 text-xs text-on-phone-muted">{t.messagePlaceholder}</div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList aria-label={t.previewTabs}>
          <TabsTrigger value="post">{t.tabPost}</TabsTrigger>
          <TabsTrigger value="comments">{t.tabComments}</TabsTrigger>
          <TabsTrigger value="dm">{t.tabDm}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
