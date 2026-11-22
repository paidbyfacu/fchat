import type { Metadata } from "next"
import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, ExternalLinkIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelBadge } from "@/components/mc/channel-icons"
import { Banner } from "@/components/mc/feedback"
import { Page } from "@/components/mc/page-header"
import { StatusBadge } from "@/components/mc/status-badge"
import { daysLeft } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getSetting, igApp, secrets } from "@/server/config"
import { env } from "@/server/env"
import { homeSummary, listAccounts, type AccountRow } from "@/server/queries"
import { requireUser } from "@/server/session"
import { CopyChip, CopyField, IgAppForm } from "./conectar-client"
import { ResubscribeButton } from "./resubscribe-button"

export const metadata: Metadata = { title: "Vincula tus redes" }

const ERRORS: Record<string, string> = {
  denied: "Cancelaste el permiso en Instagram. No se conectó nada.",
  state: "El enlace de conexión venció. Toca «Conectar Instagram» de nuevo.",
  exchange:
    "Instagram no devolvió el acceso. Revisa que la dirección de regreso del paso 5 esté pegada tal cual en Meta y que la clave secreta del paso 3 sea la correcta.",
  config: "Primero pega el identificador y la clave secreta de tu app, en el paso 3.",
}

const META_APPS = "https://developers.facebook.com/apps/"

async function Banners({ searchParams }: { searchParams: PageProps<"/conectar">["searchParams"] }) {
  const sp = await searchParams
  if (sp.connected) {
    return (
      <Banner
        tone="success"
        title="¡Instagram conectado!"
        action={
          <Link href="/automations/plantillas?bienvenida=1" className={buttonVariants({ size: "sm" })}>
            Crea tu primera automatización
          </Link>
        }
      >
        Ya llegan los comentarios y mensajes de tu cuenta.
      </Banner>
    )
  }
  const err = typeof sp.error === "string" ? ERRORS[sp.error] : undefined
  if (err) return <Banner tone="danger" title="No se pudo conectar">{err}</Banner>
  if (sp.bienvenida) {
    return (
      <Banner tone="success" title="Tu cuenta de FChat está lista">
        Ahora vincula tu Instagram. Sigue los pasos en orden: te toma unos 15 minutos y se hace una sola vez.
      </Banner>
    )
  }
  return null
}

function statusOf(a: AccountRow) {
  if (a.status === "ok") return <StatusBadge status="live" label="Conectada" />
  if (a.status === "expired") return <StatusBadge status="error" label="Acceso vencido" />
  return <StatusBadge status="stopped" label="Faltan permisos" />
}

async function Channels() {
  const user = await requireUser()
  const [accounts, app] = await Promise.all([listAccounts(user.id), igApp().catch(() => null)])
  return (
    <section aria-labelledby="canales" className="grid gap-3">
      <h2 id="canales" className="text-lg">
        Tus canales
      </h2>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-3 rounded-lg bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <ChannelBadge channel="instagram" className="size-9 rounded-md" />
            <span className="grid flex-1 gap-0.5">
              <span className="font-semibold">Instagram</span>
              <span className="text-xs text-muted-foreground">Comentarios, mensajes directos y respuestas con botón.</span>
            </span>
            {accounts.length === 0 &&
              (app ? (
                <a href="/api/instagram/connect" className={buttonVariants()}>
                  Conectar Instagram
                </a>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Sin conectar</span>
              ))}
          </div>
          {accounts.length > 0 && (
            <ul className="grid gap-2">
              {accounts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                  <Avatar size="lg">
                    {a.profile_pic_url && <AvatarImage src={a.profile_pic_url} alt="" />}
                    <AvatarFallback>{a.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">@{a.username}</span>
                      {statusOf(a)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.status === "ok"
                        ? `El acceso se renueva solo y vence en ${daysLeft(a.token_expires_at)} días`
                        : "Reconéctala para volver a responder"}
                      {" · "}
                      {a.webhooks_subscribed ? "Recibe avisos" : "Sin avisos activos"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ResubscribeButton accountId={a.id} username={a.username} />
                    <a
                      href="/api/instagram/connect"
                      className={buttonVariants({ size: "sm", variant: a.status === "ok" ? "ghost" : "default" })}
                    >
                      Reconectar
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid content-start gap-2 rounded-lg bg-card/70 p-4 shadow-card sm:p-5" aria-disabled>
          <div className="flex items-center gap-3">
            <ChannelBadge channel="tiktok" className="size-9 rounded-md" />
            <span className="grid flex-1 gap-0.5">
              <span className="font-semibold">TikTok</span>
              <span className="text-xs text-muted-foreground">Comentarios a mensaje en tus videos.</span>
            </span>
            <span className="rounded-pill bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">Próximamente</span>
          </div>
          <p className="text-xs text-muted-foreground">Cuando esté lista, la conexión con TikTok aparece aquí y se activa con un botón.</p>
        </div>
      </div>
    </section>
  )
}

type Step = {
  title: string
  time: string
  done: boolean
  body: ReactNode
  /** Paso que FChat no puede detectar: se lee y se hace, y el siguiente se abre a la vez. */
  manual?: boolean
}

function StepCard({ n, step, current, open }: { n: number; step: Step; current: boolean; open: boolean }) {
  return (
    <li>
      <details
        open={open}
        className={cn(
          "group rounded-lg bg-card shadow-card",
          current && "ring-2 ring-brand/50",
        )}
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
              step.done ? "bg-success text-white" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            {step.done ? <CheckIcon className="size-4" /> : n}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="font-semibold">
              <span className="sr-only">Paso {n}: </span>
              {step.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {step.done ? "Listo" : current ? `Sigue por aquí · ${step.time}` : step.time}
            </span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="grid gap-4 border-t border-border px-4 py-4 text-sm sm:px-5 sm:pl-16">{step.body}</div>
      </details>
    </li>
  )
}

function Where({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-subtle px-3 py-2 text-xs text-muted-foreground">{children}</p>
}

function List({ children }: { children: ReactNode }) {
  return <ol className="grid list-decimal gap-2 pl-5 marker:font-semibold marker:text-muted-foreground">{children}</ol>
}

async function Guide() {
  const user = await requireUser()
  const [app, verified, accounts, summary, verifyToken] = await Promise.all([
    igApp().catch(() => null),
    getSetting("webhook_verified_at"),
    listAccounts(user.id),
    homeSummary(user.id),
    secrets.webhookVerify(),
  ])
  const url = env.publicUrl()
  const isPublic = url.startsWith("https://")
  const connected = accounts.length > 0
  const tested = summary.comments > 0

  const steps: Step[] = [
    {
      title: "Prepara tu Instagram",
      time: "2 minutos",
      manual: true,
      done: connected || !!app,
      body: (
        <List>
          <li>
            Tu cuenta tiene que ser <strong>profesional</strong>, de empresa o de creador. En Instagram: Configuración › Tipo de cuenta y
            herramientas.
          </li>
          <li>
            Permite que FChat lea tus mensajes. En Instagram: Configuración › Mensajes y respuestas a historias › Controles de mensajes ›
            Herramientas conectadas › activa <strong>Permitir acceso a los mensajes</strong>.
          </li>
          <li>Ten a mano una segunda cuenta de Instagram para probar al final, tuya o de alguien de confianza.</li>
        </List>
      ),
    },
    {
      title: "Crea tu app en Meta",
      time: "3 minutos",
      manual: true,
      done: !!app,
      body: (
        <>
          <p className="text-muted-foreground">
            La app es tuya y gratis. Es la llave que deja a FChat responder en tu nombre, sin pasar por nadie más.
          </p>
          <List>
            <li>
              Entra a Meta for Developers con tu cuenta de Facebook y toca <strong>Crear app</strong>. Si es tu primera vez, Meta te pide
              registrarte como desarrollador: acepta y sigue.
            </li>
            <li>
              En el caso de uso elige <strong>Administrar mensajes y contenido en Instagram</strong>.
            </li>
            <li>
              Ponle un nombre que no diga «Instagram» ni «Meta», por ejemplo «Mis respuestas». Si te pide un portfolio comercial, puedes
              saltear ese paso.
            </li>
          </List>
          <a href={META_APPS} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
            Abrir Meta for Developers <ExternalLinkIcon aria-hidden />
          </a>
        </>
      ),
    },
    {
      title: "Pega los datos de tu app",
      time: "1 minuto",
      done: !!app,
      body:
        app?.source === "env" ? (
          <p className="text-muted-foreground">
            Listo: tu servidor ya los tiene en las variables IG_APP_ID e IG_APP_SECRET. Para cambiarlos, cámbialos allí.
          </p>
        ) : (
          <>
            <Where>
              En tu app de Meta: Casos de uso › Administrar mensajes y contenido en Instagram › Configuración de la API con inicio de sesión
              con Instagram.
            </Where>
            <p className="text-muted-foreground">
              Copia el <strong>Identificador de la app de Instagram</strong> y la <strong>Clave secreta de la app de Instagram</strong>. Ojo:
              es el identificador que aparece en esa pantalla, no el de la app de Meta que se ve arriba de todo.
            </p>
            <IgAppForm savedId={app?.appId} />
          </>
        ),
    },
    {
      title: "Configura el webhook",
      time: "2 minutos",
      done: !!verified,
      body: (
        <>
          <p className="text-muted-foreground">Así Meta le avisa a FChat cada vez que alguien comenta o te escribe.</p>
          <Where>En la misma pantalla de Meta, busca la sección Configurar webhooks.</Where>
          <CopyField label="URL de devolución de llamada" value={`${url}/webhook`} />
          <CopyField label="Token de verificación" value={verifyToken} secret />
          <List>
            <li>
              Pega los dos datos y toca <strong>Verificar y guardar</strong>.
            </li>
            <li>
              Suscríbete a estos campos: <CopyChip value="comments" /> <CopyChip value="messages" /> <CopyChip value="messaging_postbacks" />
            </li>
          </List>
          {verified ? (
            <p className="flex items-center gap-1.5 text-success">
              <CheckIcon className="size-4" aria-hidden /> Meta verificó tu webhook.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Cuando Meta lo verifique, este paso se marca solo al recargar la página. Si falla, revisa que la URL y el token estén
              idénticos, sin espacios.
            </p>
          )}
        </>
      ),
    },
    {
      title: "Conecta tu cuenta de Instagram",
      time: "2 minutos",
      done: connected,
      body: (
        <>
          <Where>En la misma pantalla de Meta, busca Configurar el inicio de sesión para empresas de Instagram.</Where>
          <CopyField
            label="URL de redireccionamiento de OAuth válida"
            value={`${url}/api/instagram/callback`}
            hint="Pégala tal cual y guarda. Es la dirección a la que vuelves después de dar el permiso."
          />
          <p className="text-muted-foreground">Después toca el botón, entra con tu Instagram y acepta los permisos.</p>
          {app ? (
            <a href="/api/instagram/connect" className={cn(buttonVariants(), "w-fit")}>
              {connected ? "Conectar otra cuenta" : "Conectar Instagram"}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">El botón aparece cuando guardes los datos del paso 3.</p>
          )}
          <details className="rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">¿El botón no funciona? Pega un token a mano</summary>
            <div className="mt-2 grid gap-2 text-muted-foreground">
              <p>
                En la misma pantalla de Meta, en Generar tokens de acceso, agrega tu cuenta y genera un token. Pégalo en la variable
                IG_ACCESS_TOKEN de tu servidor y vuelve a desplegar. Cuando la cuenta aparezca conectada, FChat renueva el token solo.
              </p>
            </div>
          </details>
        </>
      ),
    },
    {
      title: "Publica tu app",
      time: "3 minutos",
      done: tested,
      body: (
        <>
          <p className="text-muted-foreground">
            Mientras la app está en modo Desarrollo, Meta solo avisa los comentarios de las personas con un rol en ella. Al publicarla,
            funciona con todos.
          </p>
          <Where>En tu app de Meta: Configuración de la app › Básica.</Where>
          <CopyField label="URL de la política de privacidad" value={`${url}/privacy`} />
          <CopyField label="URL de eliminación de datos de usuario" value={`${url}/data-deletion`} />
          <List>
            <li>Elige una categoría, sube un ícono y guarda los cambios.</li>
            <li>
              Arriba de todo, cambia el modo de la app a <strong>Publicado</strong>.
            </li>
          </List>
          <p className="text-xs text-muted-foreground">
            Si Meta te pide confirmar tu identidad o algún dato, hazlo: hasta entonces puede responder «API access blocked».
          </p>
        </>
      ),
    },
    {
      title: "Crea tu primera automatización y pruébala",
      time: "3 minutos",
      done: tested,
      body: (
        <>
          <List>
            <li>Elige una plantilla, por ejemplo la de enlaces por DM desde los comentarios, y actívala con una palabra como LINK.</li>
            <li>Desde tu segunda cuenta, comenta esa palabra en el post que elegiste.</li>
            <li>Tiene que llegarte el mensaje con el botón. Tócalo y sigue los pasos hasta recibir el link.</li>
          </List>
          <p className="text-xs text-muted-foreground">
            Los comentarios de tu propia cuenta no activan nada. Si no llega el mensaje, revisa que la automatización esté activa, que el
            webhook esté verificado y que la app esté publicada.
          </p>
          <Link href="/automations/plantillas?bienvenida=1" className={cn(buttonVariants(), "w-fit")}>
            Elegir una plantilla <ArrowRightIcon aria-hidden />
          </Link>
        </>
      ),
    },
  ]
  const currentIndex = steps.findIndex((s) => !s.done)
  const done = steps.filter((s) => s.done).length

  return (
    <section aria-labelledby="guia" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="guia" className="text-lg">
            {connected ? "Guía de configuración" : "Conecta Instagram paso a paso"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {currentIndex === -1
              ? "Completaste todos los pasos. Vuelve aquí si necesitas revisar algo."
              : `${done} de ${steps.length} pasos listos. Los pasos se marcan solos cuando FChat los detecta.`}
          </p>
        </div>
        <a href={META_APPS} target="_blank" rel="noreferrer" className="text-sm font-semibold text-link hover:underline">
          Ir a mis apps de Meta
        </a>
      </div>
      {!isPublic && (
        <Banner tone="warning" title="Meta necesita una dirección pública con https">
          Ahora FChat se abre en {url}, y Meta no puede llegar ahí. Instálalo en Vercel, o usa un túnel y pon su dirección en la variable
          PUBLIC_URL.
        </Banner>
      )}
      <ol className="grid gap-3">
        {steps.map((s, i) => (
          <StepCard
            key={s.title}
            n={i + 1}
            step={s}
            current={i === currentIndex}
            // los pasos manuales se abren junto con el primero que FChat sí detecta
            open={currentIndex !== -1 && i >= currentIndex && steps.slice(currentIndex, i).every((p) => p.manual)}
          />
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Los paneles de Meta cambian seguido. Si un botón tiene otro nombre, busca el más parecido.
      </p>
    </section>
  )
}

export default function ConectarPage({ searchParams }: PageProps<"/conectar">) {
  return (
    <Page>
      <header className="grid gap-1">
        <h1 className="text-display leading-tight">
          Vincula tus <span className="fc-gradient-text">redes</span>
        </h1>
        <p className="text-muted-foreground">Conecta tus cuentas para que FChat responda comentarios y mensajes por ti.</p>
      </header>
      <Suspense fallback={null}>
        <Banners searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-32 bg-muted/60" />}>
        <Channels />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 bg-muted/60" />}>
        <Guide />
      </Suspense>
    </Page>
  )
}
