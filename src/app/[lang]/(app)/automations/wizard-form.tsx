"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition, type ReactNode } from "react"
import { toast } from "sonner"
import { ArrowLeftIcon, ImageIcon, PlusIcon, Trash2Icon, TriangleAlertIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { CountedTextarea } from "@/components/mc/counted-textarea"
import { KeywordChips } from "@/components/mc/keyword-chips"
import { OptionGroup } from "@/components/mc/option-group"
import { PhonePreview } from "@/components/mc/phone-preview"
import { PostPicker } from "@/components/mc/post-picker"
import { StatusBadge } from "@/components/mc/status-badge"
import { LIMITS } from "@/lib/message"
import { MAX_POSTS, MAX_PUBLIC_REPLIES, previewMessages, validateWizard, type Wizard, type WizardIssue } from "@/lib/wizard"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n"
import { fmt } from "@/lib/i18n/locale"
import { saveWizardAction } from "./wizard-actions"

type Account = { id: string; username: string }

function Section({ id, title, hint, issues, aside, children }: { id: string; title: string; hint?: string; issues: WizardIssue[]; aside?: ReactNode; children: ReactNode }) {
  const mine = issues.filter((i) => i.field === id)
  return (
    <section id={`s-${id}`} aria-labelledby={`h-${id}`} className="grid gap-3 rounded-md bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id={`h-${id}`} className="text-lg">
            {title}
          </h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
      {mine.length > 0 && (
        <ul className="grid gap-1" aria-live="polite">
          {mine.map((i) => (
            <li key={i.message} className="flex gap-2 rounded-sm bg-danger-subtle px-3 py-2 text-xs text-destructive">
              <TriangleAlertIcon className="size-4 shrink-0" aria-hidden /> {i.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function WizardForm({
  id,
  initial,
  status,
  accounts,
}: {
  id: string | null
  initial: Wizard
  status: "draft" | "live" | "stopped"
  accounts: Account[]
}) {
  const router = useRouter()
  const { locale, t: all } = useT()
  const t = all.automations
  const [w, setW] = useState<Wizard>(initial)
  const [issues, setIssues] = useState<WizardIssue[]>([])
  const [tried, setTried] = useState(false)
  const [picker, setPicker] = useState(false)
  const [pending, start] = useTransition()
  const [which, setWhich] = useState<"draft" | "publish" | null>(null)

  const set = <K extends keyof Wizard>(k: K, v: Wizard[K]) => setW((prev) => ({ ...prev, [k]: v }))
  // after the first attempt to publish, errors are recalculated while typing
  const shown = tried ? validateWizard(w, locale) : issues
  const username = accounts.find((a) => a.id === w.accountId)?.username ?? t.yourAccount
  const preview = useMemo(() => previewMessages(w, locale), [w, locale])

  function save(publish: boolean) {
    if (publish) {
      setTried(true)
      const local = validateWizard(w, locale)
      if (local.length) {
        setIssues(local)
        document.getElementById(`s-${local[0].field}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        toast.error(t.fixBeforePublish)
        return
      }
    }
    setWhich(publish ? "publish" : "draft")
    start(async () => {
      try {
        const r = await saveWizardAction(id, w, publish)
        if (!r.ok) {
          setIssues(r.issues)
          setTried(false)
          toast.error(r.issues[0]?.message ?? t.saveFailed)
          return
        }
        for (const warn of r.warnings) toast.warning(warn, { duration: 8000 })
        if (publish) {
          toast.success(status === "live" ? t.changesPublished : t.nowLive)
          router.push(`/automations/${r.id}`)
        } else {
          toast.success(t.draftSaved)
          if (!id) router.replace(`/automations/${r.id}/edit`)
          else router.refresh()
        }
      } catch {
        toast.error(t.saveFailedRetry)
      } finally {
        setWhich(null)
      }
    })
  }

  const firstComment = w.match === "words" && w.include[0] ? fmt(t.sampleComment, { word: w.include[0] }) : t.sampleCommentAny

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={id ? `/automations/${id}` : "/automations"} className="grid size-10 place-items-center rounded-sm hover:bg-muted" aria-label={all.common.back}>
            <ArrowLeftIcon className="size-4" />
          </Link>
          <h1 className="truncate text-xl">{id ? t.editTitle : t.newTitle}</h1>
          {id && <StatusBadge status={status} locale={locale} />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(false)} loading={pending && which === "draft"} disabled={pending}>
            {t.saveDraft}
          </Button>
          <Button onClick={() => save(true)} loading={pending && which === "publish"} disabled={pending}>
            {status === "live" ? t.publishChanges : t.publish}
          </Button>
        </div>
      </div>
      {status === "live" && (
        <p className="-mt-3 text-xs text-muted-foreground">
          {t.liveNote}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-4">
          <Section id="name" title={t.sName} issues={shown}>
            <div className={cn("grid gap-3", accounts.length > 1 && "sm:grid-cols-2")}>
              <Field label={t.internalName} hint={t.internalNameHint}>
                <Input value={w.name} maxLength={80} onChange={(e) => set("name", e.target.value)} placeholder={t.internalNamePlaceholder} />
              </Field>
              {accounts.length > 1 && (
                <Field label={t.account}>
                  <select
                    className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
                    value={w.accountId}
                    onChange={(e) => {
                      setW((prev) => ({ ...prev, accountId: e.target.value, posts: [] }))
                    }}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        @{a.username}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </Section>

          <Section id="posts" title={t.sPosts} issues={shown}>
            <OptionGroup
              label={t.sPosts}
              value={w.scope}
              onValueChange={(v) => set("scope", v as Wizard["scope"])}
              options={[
                { value: "specific", label: t.scopeSpecific, hint: t.scopeSpecificHint },
                { value: "any", label: t.scopeAny },
                { value: "next", label: t.scopeNext, hint: t.scopeNextHint },
              ]}
            />
            {w.scope === "specific" && (
              <div className="grid gap-3">
                {w.posts.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label={t.pickedPosts}>
                    {w.posts.map((p) => (
                      <li key={p.id} className="relative">
                        <div className="size-16 overflow-hidden rounded-sm bg-muted">
                          {p.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element -- thumbnail from the Instagram CDN
                            <img src={p.thumbnail} alt={p.caption ? p.caption.slice(0, 60) : t.pickedPost} className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="m-auto mt-5 size-5 text-muted-foreground" aria-label={t.pickedPost} />
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={p.caption ? fmt(t.removeNamed, { name: p.caption.slice(0, 30) }) : t.removeThisPost}
                          onClick={() => set("posts", w.posts.filter((x) => x.id !== p.id))}
                          className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border border-border bg-card shadow-card hover:bg-muted"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div>
                  <Button variant="outline" onClick={() => setPicker(true)}>
                    <PlusIcon /> {w.posts.length ? t.changePosts : t.choosePosts}
                  </Button>
                </div>
                {picker && (
                  <PostPicker
                    key={w.accountId}
                    onClose={() => setPicker(false)}
                    accountId={w.accountId}
                    value={w.posts}
                    onChange={(posts) => set("posts", posts)}
                    max={MAX_POSTS}
                  />
                )}
              </div>
            )}
          </Section>

          <Section id="include" title={t.sInclude} issues={shown}>
            <OptionGroup
              label={t.sInclude}
              value={w.match}
              onValueChange={(v) => set("match", v as Wizard["match"])}
              options={[
                { value: "words", label: t.matchWords, hint: t.matchWordsHint },
                { value: "any", label: t.matchAny },
              ]}
            />
            {w.match === "words" && <KeywordChips label={t.includeLabel} value={w.include} onChange={(v) => set("include", v)} />}
            <KeywordChips label={t.excludeLabel} value={w.exclude} onChange={(v) => set("exclude", v)} variant="exclude" placeholder={t.excludePlaceholder} />
          </Section>

          <Section
            id="publicReplies"
            title={t.sPublic}
            hint={t.sPublicHint}
            issues={shown}
            aside={<Switch aria-label={t.publicSwitch} checked={w.publicReplies.on} onCheckedChange={(on) => set("publicReplies", { ...w.publicReplies, on })} />}
          >
            {w.publicReplies.on && (
              <div className="grid gap-2">
                {w.publicReplies.texts.map((reply, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      aria-label={fmt(t.publicReply, { n: i + 1 })}
                      value={reply}
                      maxLength={300}
                      onChange={(e) => set("publicReplies", { ...w.publicReplies, texts: w.publicReplies.texts.map((x, j) => (j === i ? e.target.value : x)) })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={fmt(t.removeReply, { n: i + 1 })}
                      disabled={w.publicReplies.texts.length === 1}
                      onClick={() => set("publicReplies", { ...w.publicReplies, texts: w.publicReplies.texts.filter((_, j) => j !== i) })}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
                {w.publicReplies.texts.length < MAX_PUBLIC_REPLIES && (
                  <div>
                    <Button size="sm" variant="outline" onClick={() => set("publicReplies", { ...w.publicReplies, texts: [...w.publicReplies.texts, ""] })}>
                      <PlusIcon /> {t.anotherVariant}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Section>

          <Section id="opening" title={t.sOpening} hint={t.sOpeningHint} issues={shown}>
            <CountedTextarea label={t.text} value={w.opening.text} onChange={(text) => set("opening", { ...w.opening, text })} max={LIMITS.text} />
            <Field label={t.button}>
              <Input value={w.opening.button} onChange={(e) => set("opening", { ...w.opening, button: e.target.value })} />
            </Field>
          </Section>

          <Section
            id="askFollow"
            title={t.sAsk}
            hint={t.sAskHint}
            issues={shown}
            aside={<Switch aria-label={t.sAsk} checked={w.askFollow.on} onCheckedChange={(on) => set("askFollow", { ...w.askFollow, on })} />}
          >
            {w.askFollow.on && (
              <>
                <CountedTextarea label={t.text} value={w.askFollow.text} onChange={(text) => set("askFollow", { ...w.askFollow, text })} max={LIMITS.text} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t.confirmButton}>
                    <Input value={w.askFollow.button} onChange={(e) => set("askFollow", { ...w.askFollow, button: e.target.value })} />
                  </Field>
                  <Field
                    label={t.timesToAsk}
                    hint={w.askFollow.maxAsks ? t.timesHintSome : t.timesHintUntil}
                  >
                    <select
                      className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
                      value={w.askFollow.maxAsks}
                      onChange={(e) => set("askFollow", { ...w.askFollow, maxAsks: Number(e.target.value) })}
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n ? n : t.untilFollow}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            )}
          </Section>

          <Section id="link" title={t.sLink} issues={shown}>
            <CountedTextarea label={t.text} value={w.link.text} onChange={(text) => set("link", { ...w.link, text })} max={LIMITS.text} />
            <div className="grid gap-3">
              {w.link.links.map((l, i) => (
                <div key={i} className="grid gap-2 rounded-sm border border-border p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                  <Field label={fmt(t.buttonN, { n: i + 1 })}>
                    <Input value={l.title} onChange={(e) => set("link", { ...w.link, links: w.link.links.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                  </Field>
                  <Field label={t.url}>
                    <Input
                      type="url"
                      inputMode="url"
                      value={l.url}
                      onChange={(e) => set("link", { ...w.link, links: w.link.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={fmt(t.removeLink, { n: i + 1 })}
                    disabled={w.link.links.length === 1}
                    onClick={() => set("link", { ...w.link, links: w.link.links.filter((_, j) => j !== i) })}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              {w.link.links.length < LIMITS.buttons && (
                <div>
                  <Button size="sm" variant="outline" onClick={() => set("link", { ...w.link, links: [...w.link.links, { title: t.anotherLink, url: "https://" }] })}>
                    <PlusIcon /> {t.anotherLink}
                  </Button>
                </div>
              )}
            </div>
          </Section>
        </div>

        <aside aria-label={t.preview} className="lg:sticky lg:top-6 lg:self-start">
          <PhonePreview username={username} comment={firstComment} messages={preview} />
        </aside>
      </div>
    </div>
  )
}
