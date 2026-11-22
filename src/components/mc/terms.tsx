import { TERMS, TERMS_DATE } from "@/lib/terms"
import { cn } from "@/lib/utils"

/** Texto completo de los términos, numerado. */
export function TermsBody({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-5", className)}>
      <p className="text-xs text-muted-foreground">Última actualización: {TERMS_DATE}</p>
      {TERMS.map((s, i) => (
        <section key={s.title} className="grid gap-1.5">
          <h2 className="text-sm font-semibold">
            {i + 1}. {s.title}
          </h2>
          {s.body.map((p) => (
            <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}

/** Lo más importante, en tres líneas, para leer antes de aceptar. */
export const TERMS_HIGHLIGHTS = [
  "Es gratis y de código abierto, pero no puedes venderlo ni cobrar por él.",
  "Tu instalación, tus cuentas y lo que envías quedan bajo tu responsabilidad.",
  "FChat no responde por baneos, bloqueos ni por el mal uso de la plataforma.",
]
