"use client"

import Link from "next/link"
import { ArrowRightIcon, CircleFadingPlusIcon, ListOrderedIcon, MessageCircleIcon, RadioIcon, SendIcon, UserPlusIcon } from "lucide-react"
import { ChannelBadge } from "@/components/mc/channel-icons"
import type { Template, TemplateIcon } from "@/lib/templates"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n"

const ICONS: Record<TemplateIcon, typeof MessageCircleIcon> = {
  comment: MessageCircleIcon,
  follow: UserPlusIcon,
  dm: SendIcon,
  story: CircleFadingPlusIcon,
  sequence: ListOrderedIcon,
  live: RadioIcon,
}

/** Template card for Home and Templates. The ones that are not ready say Coming soon. */
export function TemplateCard({ t, detailed = false }: { t: Template; detailed?: boolean }) {
  const Icon = ICONS[t.icon]
  const { t: m } = useT()
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="flex items-center gap-2">
          <ChannelBadge channel={t.channel} />
          <span className="grid size-8 place-items-center rounded-sm bg-brand-subtle text-on-brand-subtle">
            <Icon className="size-4" aria-hidden />
          </span>
        </span>
        {t.popular ? (
          <span className="rounded-pill bg-primary px-2 py-0.5 text-[0.6875rem] font-bold tracking-wide text-primary-foreground uppercase">{m.common.popular}</span>
        ) : !t.ready ? (
          <span className="rounded-pill bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">{m.common.comingSoon}</span>
        ) : null}
      </span>
      <span className="grid gap-1">
        <span className="text-base leading-snug font-semibold text-foreground">{t.title}</span>
        <span className="text-sm text-muted-foreground">{t.description}</span>
      </span>
      {detailed && (
        <ol className="grid gap-1 text-xs text-muted-foreground">
          {t.steps.map((s, i) => (
            <li key={s} className="flex gap-2">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-muted text-[0.625rem] font-semibold text-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      )}
      <span className={cn("mt-auto flex items-center gap-1 text-sm font-semibold", t.ready ? "text-link" : "text-muted-foreground")}>
        {t.ready ? m.common.useTemplate : t.href ? m.common.seeHowItWorks : m.common.verySoon}
        {(t.ready || t.href) && <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </span>
    </>
  )
  const cls = cn(
    "group flex min-h-52 flex-col gap-4 rounded-lg bg-card p-5 shadow-card transition-shadow",
    t.popular && "fc-glow",
    (t.ready || t.href) && "hover:shadow-pop",
    !t.ready && "bg-card/70",
  )
  return t.href ? (
    <Link href={t.href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls} aria-disabled>
      {body}
    </div>
  )
}
