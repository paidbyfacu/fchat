import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatTile({
  label,
  value,
  delta,
}: {
  label: string
  value: number | null
  /** variación en % contra el período anterior */
  delta?: number
}) {
  return (
    <div className="grid gap-1 rounded-md bg-card p-4 shadow-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      {value === null ? (
        <>
          <span className="text-xl text-muted-foreground">—</span>
          <span className="text-xs text-muted-foreground">Sin datos todavía</span>
        </>
      ) : (
        <span className="text-xl tabular-nums">{value.toLocaleString("es-AR")}</span>
      )}
      {delta !== undefined && value !== null && (
        <span className={cn("inline-flex items-center gap-1 text-xs font-medium", delta >= 0 ? "text-success" : "text-destructive")}>
          {delta >= 0 ? <ArrowUpRightIcon className="size-3.5" aria-hidden /> : <ArrowDownRightIcon className="size-3.5" aria-hidden />}
          {delta >= 0 ? "Subió" : "Bajó"} {Math.abs(delta)} % contra el período anterior
        </span>
      )}
    </div>
  )
}

/** Embudo por paso, con % respecto del paso anterior. También como tabla para lectores de pantalla. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value))
  return (
    <div className="rounded-md bg-card p-4 shadow-card">
      <ol className="grid gap-3" aria-hidden>
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].value : null
          const pct = prev ? Math.round((s.value / prev) * 100) : null
          return (
            <li key={s.label} className="grid gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span>{s.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{s.value.toLocaleString("es-AR")}</span>
                  {pct !== null && <span className="ml-2 text-xs text-muted-foreground">{pct} %</span>}
                </span>
              </div>
              <div className="h-2 rounded-pill bg-muted">
                <div className="h-2 rounded-pill bg-brand" style={{ width: `${(s.value / max) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ol>
      <table className="sr-only">
        <caption>Embudo de la automatización</caption>
        <thead>
          <tr>
            <th>Paso</th>
            <th>Personas</th>
            <th>Respecto del paso anterior</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s, i) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td>{s.value}</td>
              <td>{i > 0 && steps[i - 1].value ? `${Math.round((s.value / steps[i - 1].value) * 100)} %` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
