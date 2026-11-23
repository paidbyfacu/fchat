import type { Locale } from "@/lib/i18n/locale"
import { TERMS } from "@/lib/terms"
import { cn } from "@/lib/utils"

/** Full text of the terms, numbered, in the page language. */
export function TermsBody({ locale, className }: { locale: Locale; className?: string }) {
  const terms = TERMS[locale]
  return (
    <div className={cn("grid gap-5", className)}>
      <p className="text-xs text-muted-foreground">
        {terms.updated} {terms.date}
      </p>
      {terms.sections.map((s, i) => (
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
