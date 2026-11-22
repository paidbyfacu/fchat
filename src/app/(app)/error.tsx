"use client"

import Link from "next/link"
import { AlertTriangleIcon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"

// Si una página del panel falla en el servidor, se ve esto dentro del menú de siempre,
// en lugar de la pantalla genérica de Next en inglés.
export default function PanelError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : ""
  return (
    <div className="grid min-h-[60svh] place-items-center p-6">
      <div className="grid max-w-md justify-items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden>
          <AlertTriangleIcon className="size-6" />
        </span>
        <h1 className="text-xl">Esta página no pudo cargar</h1>
        <p className="text-sm text-muted-foreground">
          Algo falló en el servidor. Prueba otra vez; si sigue pasando, revisa los registros de tu Vercel.
        </p>
        {digest && <p className="font-mono text-xs text-muted-foreground">Código del error: {digest}</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Button onClick={() => retry()}>Reintentar</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
