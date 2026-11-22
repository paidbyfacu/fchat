import type { ReactNode } from "react"

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h1 className="text-xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto grid w-full max-w-[var(--tk-layout-content-max)] content-start gap-6 px-4 py-6 sm:px-6 md:py-8">{children}</main>
}
