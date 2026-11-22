import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BellIcon,
  ExternalLinkIcon,
  InboxIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  MousePointerClickIcon,
  SearchIcon,
  StarIcon,
  ZapIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelBadge, InstagramGlyph, TikTokGlyph } from "@/components/mc/channel-icons"
import { windowLeft } from "@/components/mc/inbox"
import { cn } from "@/lib/utils"
import {
  conversationTimeline,
  getConversationContact,
  inboxCounts,
  listConversations,
  messageButtons,
  messagePreview,
  messageText,
  type InboxFilters,
  type InboxRow,
  type TimelineItem,
} from "@/server/inbox"
import { listAccounts } from "@/server/queries"
import { requireUser } from "@/server/session"
import { AutoRefresh, ConversationActions, FilterMenu, InboxComposer, MarkRead, ScrollToEnd } from "./inbox-client"

export const metadata: Metadata = { title: "Bandeja" }

type Params = { c?: string; f?: string; st?: string; unread?: string; sort?: string; q?: string }

function parse(p: Params): InboxFilters & { contact: string | null } {
  return {
    contact: p.c && /^[0-9a-f-]{36}$/i.test(p.c) ? p.c : null,
    folder: p.f === "reminders" || p.f === "starred" ? p.f : "all",
    status: p.st === "closed" ? "closed" : "open",
    unread: p.unread === "1",
    sort: p.sort === "old" ? "old" : "new",
    q: (p.q ?? "").trim().slice(0, 60),
  }
}

/** Link a la bandeja con los filtros actuales más los cambios pedidos. */
function hrefWith(f: ReturnType<typeof parse>, change: Partial<Record<keyof Params, string | null>>) {
  const cur: Record<string, string | null> = {
    c: f.contact,
    f: f.folder === "all" ? null : f.folder,
    st: f.status === "open" ? null : f.status,
    unread: f.unread ? "1" : null,
    sort: f.sort === "new" ? null : f.sort,
    q: f.q || null,
  }
  const next = { ...cur, ...change }
  const qs = new URLSearchParams(Object.entries(next).filter((e): e is [string, string] => !!e[1]))
  const s = qs.toString()
  return s ? `/inbox?${s}` : "/inbox"
}

const displayName = (c: { username: string | null; name: string | null }) => c.name || (c.username ? `@${c.username}` : "Contacto de Instagram")

function fmt(tz: string, d: Date, o: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("es", { timeZone: tz, ...o }).format(d)
  } catch {
    return new Intl.DateTimeFormat("es", o).format(d)
  }
}

const dayKey = (tz: string, d: Date) => fmt(tz, d, { year: "numeric", month: "2-digit", day: "2-digit" })

function listTime(tz: string, d: Date, now: Date) {
  if (dayKey(tz, d) === dayKey(tz, now)) return fmt(tz, d, { hour: "2-digit", minute: "2-digit" })
  if (now.getTime() - d.getTime() < 6 * 86400_000) return fmt(tz, d, { weekday: "short" })
  return fmt(tz, d, { day: "numeric", month: "short" })
}

function dayLabel(tz: string, d: Date, now: Date) {
  if (dayKey(tz, d) === dayKey(tz, now)) return "Hoy"
  if (dayKey(tz, d) === dayKey(tz, new Date(now.getTime() - 86400_000))) return "Ayer"
  return fmt(tz, d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <div className="flex h-[calc(100svh-var(--tk-layout-header))] min-h-[480px] bg-card/60 backdrop-blur-sm">
      <Suspense fallback={<InboxSkeleton />}>
        <Inbox searchParams={searchParams as Promise<Params>} />
      </Suspense>
    </div>
  )
}

function InboxSkeleton() {
  return (
    <>
      <div className="hidden w-56 shrink-0 border-r border-border p-3 lg:block">
        <Skeleton className="h-6 w-24 bg-muted" />
      </div>
      <div className="grid w-full content-start gap-3 border-r border-border p-3 md:w-80">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 bg-muted" />
        ))}
      </div>
      <div className="hidden flex-1 md:block" />
    </>
  )
}

async function Inbox({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await requireUser()
  const f = parse(await searchParams)
  const [rows, counts, accounts, contact] = await Promise.all([
    listConversations(user.id, f),
    inboxCounts(user.id),
    listAccounts(user.id),
    f.contact ? getConversationContact(user.id, f.contact) : Promise.resolve(null),
  ])
  const now = new Date()
  const tz = user.timezone

  return (
    <>
      <AutoRefresh />
      <Folders f={f} counts={counts} accounts={accounts.length} />
      <section
        aria-label="Conversaciones"
        className={cn("flex w-full min-w-0 flex-col border-r border-border bg-card md:w-80 md:shrink-0", contact && "hidden md:flex")}
      >
        <Toolbar f={f} counts={counts} />
        {rows.length ? (
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {rows.map((r) => (
              <li key={r.id}>
                <ConversationLink row={r} href={hrefWith(f, { c: r.id })} active={r.id === contact?.id} time={listTime(tz, r.last_message_at, now)} now={now} />
              </li>
            ))}
          </ul>
        ) : (
          <ListEmpty f={f} hasAccount={accounts.length > 0} />
        )}
      </section>
      <section aria-label="Conversación" className={cn("min-w-0 flex-1 flex-col", contact ? "flex" : "hidden md:flex")}>
        {contact ? <Conversation userId={user.id} tz={tz} now={now} contact={contact} back={hrefWith(f, { c: null })} /> : <NoConversation />}
      </section>
    </>
  )
}

function Folders({ f, counts, accounts }: { f: ReturnType<typeof parse>; counts: Awaited<ReturnType<typeof inboxCounts>>; accounts: number }) {
  const items = [
    { key: "all", label: "Todos los chats", icon: MessagesSquareIcon, n: f.status === "closed" ? counts.closed : counts.open },
    { key: "reminders", label: "Recordatorios", icon: BellIcon, n: counts.reminders },
    { key: "starred", label: "Favoritos", icon: StarIcon, n: counts.starred },
  ] as const
  return (
    <nav aria-label="Carpetas de la bandeja" className="hidden w-56 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border p-3 lg:flex">
      <div className="grid gap-1">
        <h1 className="px-2 pb-1 text-lg">Bandeja</h1>
        {items.map((it) => {
          const active = f.folder === it.key
          return (
            <Link
              key={it.key}
              href={hrefWith(f, { f: it.key === "all" ? null : it.key, c: null })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-sm px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                active && "bg-brand-subtle text-on-brand-subtle hover:bg-brand-subtle hover:text-on-brand-subtle",
              )}
            >
              <it.icon className="size-4" aria-hidden />
              <span className="flex-1">{it.label}</span>
              <span className="text-xs tabular-nums">{it.n}</span>
            </Link>
          )
        })}
      </div>
      <div className="grid gap-1">
        <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Canales</p>
        <span className="flex h-9 items-center gap-2.5 px-2 text-sm">
          <InstagramGlyph className="size-4 text-[#e1306c]" />
          <span className="flex-1">Instagram</span>
          <span className={cn("size-2 rounded-full", accounts ? "bg-success" : "bg-muted-foreground/40")} aria-label={accounts ? "Conectado" : "Sin conectar"} />
        </span>
        <span className="flex h-9 items-center gap-2.5 px-2 text-sm text-muted-foreground">
          <TikTokGlyph className="size-4" />
          <span className="flex-1">TikTok</span>
          <span className="rounded-pill bg-muted px-2 py-0.5 text-[0.6875rem] font-medium">Próximamente</span>
        </span>
      </div>
      <div className="mt-auto rounded-md bg-subtle p-3 text-xs text-muted-foreground">
        Instagram te deja responder a mano hasta 24 h después del último mensaje de cada persona.
      </div>
    </nav>
  )
}

function Toolbar({ f, counts }: { f: ReturnType<typeof parse>; counts: Awaited<ReturnType<typeof inboxCounts>> }) {
  return (
    <div className="grid gap-2 border-b border-border p-3">
      <div className="flex items-center gap-1">
        <h1 className="sr-only lg:hidden">Bandeja</h1>
        <FilterMenu
          className="-ml-2 text-base font-semibold"
          label={f.folder === "reminders" ? "Recordatorios" : f.folder === "starred" ? "Favoritos" : f.status === "closed" ? "Chats cerrados" : "Chats abiertos"}
          items={[
            { label: `Chats abiertos · ${counts.open}`, href: hrefWith(f, { st: null, f: null, c: null }), active: f.folder === "all" && f.status === "open" },
            { label: `Chats cerrados · ${counts.closed}`, href: hrefWith(f, { st: "closed", f: null, c: null }), active: f.folder === "all" && f.status === "closed" },
            { label: `Recordatorios · ${counts.reminders}`, href: hrefWith(f, { f: "reminders", c: null }), active: f.folder === "reminders" },
            { label: `Favoritos · ${counts.starred}`, href: hrefWith(f, { f: "starred", c: null }), active: f.folder === "starred" },
          ]}
        />
        <Link
          href={hrefWith(f, { unread: f.unread ? null : "1", c: null })}
          aria-pressed={f.unread}
          className={cn(
            "ml-auto flex h-8 items-center gap-1.5 rounded-pill border border-border px-3 text-xs font-medium hover:bg-muted",
            f.unread && "border-transparent bg-brand-subtle text-on-brand-subtle hover:bg-brand-subtle",
          )}
        >
          No leído{counts.unread ? ` · ${counts.unread}` : ""}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <FilterMenu
          label={`Ordenar: ${f.sort === "old" ? "Más antiguo" : "Más reciente"}`}
          className="-ml-2 text-xs"
          items={[
            { label: "Más reciente", href: hrefWith(f, { sort: null }), active: f.sort === "new" },
            { label: "Más antiguo", href: hrefWith(f, { sort: "old" }), active: f.sort === "old" },
          ]}
        />
        <FilterMenu
          label="Todos los canales"
          className="text-xs"
          items={[
            { label: "Todos los canales", href: hrefWith(f, {}), active: true },
            { label: "Instagram", href: hrefWith(f, {}) },
            { label: "TikTok", disabled: true, hint: "Próximamente" },
          ]}
        />
      </div>
      <form action="/inbox" className="relative">
        {f.folder !== "all" && <input type="hidden" name="f" value={f.folder} />}
        {f.status === "closed" && <input type="hidden" name="st" value="closed" />}
        {f.unread && <input type="hidden" name="unread" value="1" />}
        {f.sort === "old" && <input type="hidden" name="sort" value="old" />}
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={f.q}
          aria-label="Buscar por nombre o usuario"
          placeholder="Filtrar por nombre o @usuario"
          className="h-9 w-full rounded-sm border border-border bg-background pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        />
      </form>
    </div>
  )
}

function ConversationLink({ row, href, active, time, now }: { row: InboxRow; href: string; active: boolean; time: string; now: Date }) {
  const name = displayName(row)
  const open = windowLeft(row.last_inbound_at, now) !== null
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex gap-3 border-b border-border/60 px-3 py-3 transition-colors hover:bg-muted/70",
        active && "bg-brand-subtle/70 hover:bg-brand-subtle/70",
      )}
    >
      <span className="relative shrink-0">
        <Avatar size="lg">
          {row.profile_pic_url && <AvatarImage src={row.profile_pic_url} alt="" />}
          <AvatarFallback>{name.replace("@", "").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-card shadow-card">
          <InstagramGlyph className="size-3 text-[#e1306c]" />
        </span>
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm", row.unread_count ? "font-bold" : "font-medium")}>{name}</span>
          <span className={cn("shrink-0 text-xs", row.unread_count ? "font-semibold text-primary" : "text-muted-foreground")}>{time}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-xs", row.unread_count ? "text-foreground" : "text-muted-foreground")}>
            {messagePreview(row.last_kind, row.last_body, row.last_direction)}
          </span>
          {row.starred && <StarIcon className="size-3.5 shrink-0 fill-current text-[#e5a50a]" aria-label="Favorito" />}
          {row.remind_at && <BellIcon className="size-3.5 shrink-0 text-primary" aria-label="Con recordatorio" />}
          {row.unread_count > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-pill bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground">
              <span className="sr-only">Sin leer: </span>
              {row.unread_count}
            </span>
          )}
        </span>
        {open && <span className="text-[0.6875rem] text-success">Puedes responderle</span>}
      </span>
    </Link>
  )
}

function ListEmpty({ f, hasAccount }: { f: ReturnType<typeof parse>; hasAccount: boolean }) {
  const filtered = f.q || f.unread || f.folder !== "all" || f.status === "closed"
  return (
    <div className="grid flex-1 content-center justify-items-center gap-2 p-6 text-center">
      <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-semibold">{filtered ? "Nada con estos filtros" : "Todavía no hay conversaciones"}</p>
      <p className="max-w-60 text-sm text-muted-foreground">
        {filtered
          ? "Prueba con otro filtro o vuelve a todos los chats."
          : hasAccount
            ? "Cuando alguien te escriba o una automatización le mande un DM, la conversación aparece aquí."
            : "Primero vincula tu cuenta de Instagram."}
      </p>
      {filtered ? (
        <Link href="/inbox" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Ver todos los chats
        </Link>
      ) : (
        !hasAccount && (
          <Link href="/conectar" className={buttonVariants({ size: "sm" })}>
            Vincular Instagram
          </Link>
        )
      )}
    </div>
  )
}

function NoConversation() {
  return (
    <div className="relative grid flex-1 place-items-center overflow-hidden p-8">
      <div className="grid max-w-sm justify-items-center gap-4 text-center">
        <div className="relative">
          <div className="fc-float grid size-24 place-items-center rounded-[28px] bg-card shadow-pop">
            <MessageCircleIcon className="size-10 text-brand" aria-hidden />
          </div>
          <ChannelBadge channel="instagram" className="absolute -top-2 -right-4 rotate-12 shadow-card" />
          <ChannelBadge channel="tiktok" className="absolute -bottom-2 -left-4 -rotate-12 opacity-60 shadow-card" />
        </div>
        <p className="text-lg font-semibold">Aquí podrás chatear con tus contactos en todos los canales conectados</p>
        <p className="text-sm text-muted-foreground">Elige una conversación de la lista para ver todo lo que hablaron, responder o dejar una nota.</p>
      </div>
    </div>
  )
}

async function Conversation({
  userId,
  tz,
  now,
  contact,
  back,
}: {
  userId: string
  tz: string
  now: Date
  contact: NonNullable<Awaited<ReturnType<typeof getConversationContact>>>
  back: string
}) {
  const items = await conversationTimeline(userId, contact.id)
  const name = displayName(contact)
  const hoursLeft = windowLeft(contact.last_inbound_at, now)
  const remind = contact.remind_at ? fmt(tz, contact.remind_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null

  const groups: { label: string; items: TimelineItem[] }[] = []
  for (const it of items) {
    const label = dayLabel(tz, it.at, now)
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(it)
    else groups.push({ label, items: [it] })
  }

  return (
    <div className="flex min-h-0 flex-1">
      <MarkRead id={contact.id} needed={contact.unread_count > 0 || !contact.username} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-3 py-2.5 sm:px-4">
          <Link href={back} className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "md:hidden")} aria-label="Volver a la lista">
            <ArrowLeftIcon />
          </Link>
          <Avatar size="lg">
            {contact.profile_pic_url && <AvatarImage src={contact.profile_pic_url} alt="" />}
            <AvatarFallback>{name.replace("@", "").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold">{name}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {contact.username && contact.name ? `@${contact.username} · ` : ""}
              {hoursLeft === null ? "Ventana cerrada" : `Ventana abierta · ${hoursLeft} h`}
            </p>
          </div>
          <ConversationActions id={contact.id} starred={contact.starred} status={contact.inbox_status} remindAt={remind} />
        </header>
        <div className="flex items-center gap-2 border-b border-border bg-card px-4">
          <span className="flex h-10 items-center gap-1.5 border-b-2 border-primary text-sm font-medium">
            <InstagramGlyph className="size-4 text-[#e1306c]" /> Instagram
          </span>
          <span className="flex h-10 items-center gap-1.5 px-2 text-sm text-muted-foreground">
            <TikTokGlyph className="size-4" /> TikTok <span className="rounded-pill bg-muted px-1.5 text-[0.625rem]">Pronto</span>
          </span>
        </div>
        <ScrollToEnd count={items.length} className="min-h-0 flex-1 overflow-y-auto bg-subtle/70 px-3 py-4 sm:px-6">
          {groups.length ? (
            <div className="mx-auto grid max-w-3xl gap-3">
              {groups.map((g) => (
                <div key={g.label} className="grid gap-2">
                  <div className="sticky top-0 z-10 flex justify-center py-1">
                    <span className="rounded-pill bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card first-letter:uppercase">{g.label}</span>
                  </div>
                  {g.items.map((it) => (
                    <TimelineRow key={`${it.type}-${it.id}`} item={it} tz={tz} account={contact.account} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-10 text-center text-sm text-muted-foreground">Todavía no hay mensajes con esta persona.</p>
          )}
        </ScrollToEnd>
        <InboxComposer id={contact.id} hoursLeft={hoursLeft} name={name} />
      </div>
      <ContactPanel contact={contact} name={name} tz={tz} />
    </div>
  )
}

function TimelineRow({ item, tz, account }: { item: TimelineItem; tz: string; account: string }) {
  const time = fmt(tz, item.at, { hour: "2-digit", minute: "2-digit" })
  if (item.type === "comment") {
    return (
      <SystemLine icon={MessageCircleIcon}>
        Comentó «{item.text}» en una publicación de @{account}
        {item.automation ? ` y activó «${item.automation}»` : ""} · {time}
      </SystemLine>
    )
  }
  const b = (item.body ?? {}) as Record<string, unknown>
  if (item.kind === "postback") {
    return (
      <SystemLine icon={MousePointerClickIcon}>
        Tocó el botón «{String(b.title ?? "")}» · {time}
      </SystemLine>
    )
  }
  if (item.kind === "note") {
    return (
      <div className="ml-auto grid w-fit max-w-[85%] gap-1 rounded-md border border-[#f0d77a] bg-[#fff6cc] px-3 py-2 text-sm text-[#5c4a00] sm:max-w-[70%]">
        <span className="text-[0.6875rem] font-semibold tracking-wide uppercase">Nota interna</span>
        <span className="whitespace-pre-wrap">{messageText(item.kind, b)}</span>
        <span className="text-right text-[0.6875rem] opacity-70">{time}</span>
      </div>
    )
  }
  const mine = item.direction === "out"
  const text =
    messageText(item.kind, b) ||
    (item.kind === "media" ? (mine ? "Enviaste un archivo" : "Envió un archivo") : item.kind === "story_reply" ? "Respondió a tu historia" : "Mensaje")
  const buttons = messageButtons(item.body)
  const by = !mine ? null : item.sent_by === "human" ? "Tú" : item.automation ? `Automatización «${item.automation}»` : "Automatización"
  return (
    <div className={cn("grid max-w-[85%] gap-1 sm:max-w-[70%]", mine ? "ml-auto justify-items-end" : "justify-items-start")}>
      {item.kind === "private_reply" && <span className="text-[0.6875rem] text-muted-foreground">Respuesta privada al comentario</span>}
      <div
        className={cn(
          "grid gap-2 rounded-lg px-3 py-2 text-sm shadow-card",
          mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card text-foreground",
          item.error && "opacity-70",
        )}
      >
        <span className="break-words whitespace-pre-wrap">{text}</span>
        {buttons.length > 0 && (
          <span className="grid gap-1">
            {buttons.map((x, i) => (
              <span key={i} className={cn("rounded-sm px-3 py-1.5 text-center text-xs font-semibold", mine ? "bg-white/20" : "bg-muted")}>
                {x.title}
              </span>
            ))}
          </span>
        )}
      </div>
      <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
        {by && (
          <>
            {item.sent_by !== "human" && <ZapIcon className="size-3" aria-hidden />}
            {by} ·
          </>
        )}{" "}
        {time}
      </span>
      {item.error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircleIcon className="size-3.5" aria-hidden /> No se envió: {item.error.message ?? "error de Instagram"}
        </span>
      )}
    </div>
  )
}

function SystemLine({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="mx-auto flex max-w-[90%] items-center gap-1.5 text-center text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function ContactPanel({
  contact,
  name,
  tz,
}: {
  contact: NonNullable<Awaited<ReturnType<typeof getConversationContact>>>
  name: string
  tz: string
}) {
  const rows = [
    { label: "Canal", value: `Instagram de @${contact.account}` },
    { label: "Te sigue", value: contact.follows_business === null ? "Sin revisar" : contact.follows_business ? "Sí" : "No" },
    { label: "Aceptó mensajes", value: contact.opted_in ? "Sí" : "Todavía no" },
    { label: "Primer contacto", value: fmt(tz, contact.created_at, { day: "numeric", month: "long", year: "numeric" }) },
  ]
  return (
    <aside aria-label="Datos del contacto" className="hidden w-72 shrink-0 overflow-y-auto border-l border-border bg-card p-4 xl:block">
      <div className="grid justify-items-center gap-2 pb-4 text-center">
        <Avatar className="size-16">
          {contact.profile_pic_url && <AvatarImage src={contact.profile_pic_url} alt="" />}
          <AvatarFallback className="text-xl">{name.replace("@", "").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <p className="font-semibold">{name}</p>
        {contact.username && (
          <a
            href={`https://www.instagram.com/${encodeURIComponent(contact.username)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-link hover:underline"
          >
            Ver perfil en Instagram <ExternalLinkIcon className="size-3" aria-hidden />
          </a>
        )}
      </div>
      <dl className="grid gap-3 border-t border-border pt-4 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-0.5">
            <dt className="text-xs text-muted-foreground">{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 grid gap-1 rounded-md bg-subtle p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Etiquetas y campos</p>
        <p>Próximamente podrás etiquetar contactos y guardar datos como su email.</p>
      </div>
    </aside>
  )
}
