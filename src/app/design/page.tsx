import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { PlusIcon, WorkflowIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TopNav } from "@/components/mc/top-nav"
import { logout } from "@/app/(app)/actions"
import { Banner, EmptyState } from "@/components/mc/feedback"
import { ConversationItem } from "@/components/mc/inbox"
import { Funnel, StatTile } from "@/components/mc/stats"
import { StatusBadge } from "@/components/mc/status-badge"
import { ComposerDemo, OverlaysDemo, TogglesDemo, WizardDemo } from "./demo"

export const metadata: Metadata = { title: "Sistema de diseño" }

// Página de referencia del sistema de diseño. No existe en producción.
const COLORS = [
  "bg", "surface", "subtle", "border", "border-input", "text", "text-muted", "accent", "on-accent",
  "link", "focus", "danger", "danger-subtle", "success", "success-subtle", "warning", "warning-subtle",
  "highlight", "phone", "bubble-in", "bubble-out",
]
const TYPE = [
  ["display", "text-display", "Automatizaciones"],
  ["xl", "text-xl", "Comentario → DM"],
  ["lg", "text-lg", "Cuando alguien comenta en"],
  ["base", "text-base", "Responde cada comentario con un DM, aunque estés offline."],
  ["sm", "text-sm", "Texto de la interfaz, etiquetas y tablas."],
  ["xs", "text-xs", "Notas, contadores y badges"],
] as const

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <div className="grid gap-1">
        <h2 id={id} className="text-xl">
          {title}
        </h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export default function DesignPage() {
  if (process.env.NODE_ENV === "production" && process.env.SHOW_DESIGN !== "1") notFound()

  return (
    <main className="mx-auto grid max-w-[var(--tk-layout-content-max)] gap-14 px-4 py-10 sm:px-6">
      <header className="grid gap-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Sistema de diseño</p>
        <h1 className="text-display">Componentes</h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Todo sale de <code className="font-mono text-sm">src/app/tokens.css</code>. Para cambiar la marca, edita
          <code className="font-mono text-sm">--tk-brand</code> y <code className="font-mono text-sm">--tk-accent</code>.
        </p>
      </header>

      <Section id="colores" title="Colores" note="Roles, no colores. El color de marca (accent) es un placeholder neutro.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map((c) => (
            <li key={c} className="grid gap-1.5">
              <span className="h-12 rounded-sm border border-border" style={{ background: `var(--tk-${c})` }} />
              <span className="font-mono text-xs">{c}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tipo" title="Tipografía" note="Inter. Escala 12 · 14 · 16 · 18 · 24 · 32.">
        <div className="grid gap-3 rounded-md bg-card p-5 shadow-card">
          {TYPE.map(([name, cls, sample]) => (
            <div key={name} className="grid grid-cols-[64px_1fr] items-baseline gap-4">
              <span className="font-mono text-xs text-muted-foreground">{name}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="botones" title="Botones" note="sm 32 · md 40 · lg 48. Prueba con Tab: el foco siempre se ve.">
        <div className="grid gap-4 rounded-md bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Publicar</Button>
            <Button variant="outline">Guardar borrador</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="destructive">Eliminar</Button>
            <Button variant="link">Ver detalle</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Chico</Button>
            <Button>Mediano</Button>
            <Button size="lg">Grande</Button>
            <Button size="icon" variant="outline" aria-label="Nueva automatización">
              <PlusIcon />
            </Button>
            <Button disabled>Deshabilitado</Button>
            <Button loading>Publicando</Button>
          </div>
        </div>
      </Section>

      <Section id="campos" title="Campos">
        <div className="grid gap-4 rounded-md bg-card p-5 shadow-card sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Nombre
            <Input placeholder="Link de la guía" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            URL
            <Input defaultValue="hola" aria-invalid aria-describedby="url-err" />
            <span id="url-err" className="text-xs font-normal text-destructive">
              Tiene que empezar con https://
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-muted-foreground">
            Deshabilitado
            <Input disabled defaultValue="@tucuenta" />
          </label>
        </div>
        <TogglesDemo />
      </Section>

      <Section
        id="asistente"
        title="Asistente: comentario → DM"
        note="Filas de opción, chips de palabras, editor de mensaje y vista previa conectados. Prueba borrar el botón de respuesta del primer DM."
      >
        <WizardDemo />
      </Section>

      <Section id="estados" title="Estados">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="live" />
          <StatusBadge status="draft" />
          <StatusBadge status="stopped" />
          <StatusBadge status="error" />
          <StatusBadge status="new" />
        </div>
        <div className="grid gap-3">
          <Banner tone="danger" title="Reconecta @tucuenta" action={<Button size="sm">Reconectar</Button>}>
            El acceso a Instagram venció. Mientras tanto no se responde nada.
          </Banner>
          <Banner tone="warning" title="Otra automatización ya usa la palabra «link»">
            Si las dos responden, gana la más rápida y la otra falla.
          </Banner>
          <Banner tone="success" title="Automatización activa" />
          <Banner tone="info" title="La dirección del panel cambió">
            Actualízala en el panel de Meta.
          </Banner>
        </div>
      </Section>

      <Section id="metricas" title="Métricas">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatTile label="Comentarios" value={1284} delta={12} />
          <StatTile label="DMs enviados" value={1190} delta={9} />
          <StatTile label="Seguidores nuevos" value={312} delta={-4} />
          <StatTile label="Clics en el link" value={null} />
        </div>
        <Funnel
          steps={[
            { label: "Comentaron", value: 1284 },
            { label: "Recibieron el DM", value: 1190 },
            { label: "Tocaron el botón", value: 802 },
            { label: "Te siguen", value: 655 },
            { label: "Abrieron el link", value: 431 },
          ]}
        />
      </Section>

      <Section id="tabla" title="Tabla">
        <div className="overflow-x-auto rounded-md bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Disparos (7 d)</TableHead>
                <TableHead>Editada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Guía gratis", "live", 412, "hoy"],
                ["Lista de herramientas", "stopped", 0, "hace 3 días"],
                ["Sorteo de noviembre", "draft", 0, "ayer"],
              ].map(([name, status, n, when]) => (
                <TableRow key={name as string}>
                  <TableCell>
                    <a href="#" className="font-medium hover:underline">
                      {name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status as "live" | "stopped" | "draft"} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{n}</TableCell>
                  <TableCell className="text-muted-foreground">{when}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-2 rounded-md bg-card p-4 shadow-card" aria-busy="true" aria-label="Cargando">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full bg-muted" />
          ))}
        </div>
      </Section>

      <Section id="bandeja" title="Bandeja">
        <div className="grid gap-1 rounded-md bg-card p-2 shadow-card md:max-w-sm">
          <ConversationItem name="razerlife_roleplay" preview="Ya te sigo 🙌" time="20:34" unread={2} hoursLeft={23} active />
          <ConversationItem name="maria.ok" preview="¿Sirve para tiendas?" time="ayer" unread={0} hoursLeft={3} />
          <ConversationItem name="lu_garcia" preview="Gracias!" time="lun" unread={0} hoursLeft={null} />
        </div>
        <ComposerDemo />
      </Section>

      <Section id="overlays" title="Modal, toast y tooltip">
        <OverlaysDemo />
      </Section>

      <Section id="vacio" title="Estado vacío">
        <EmptyState
          icon={WorkflowIcon}
          title="Todavía no hay automatizaciones"
          description="Empieza por la más usada: responder con un DM a quien comenta una palabra."
          action={
            <Button>
              <PlusIcon /> Crear la primera
            </Button>
          }
        />
      </Section>

      <Section id="nav" title="Navegación">
        <div className="relative overflow-visible rounded-md shadow-card">
          <TopNav current="/automations" username="@tucuenta" email="tu@email.com" unread={3} logout={logout} />
        </div>
      </Section>
    </main>
  )
}
