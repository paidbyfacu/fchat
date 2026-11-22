import type { Metadata } from "next"

export const metadata: Metadata = { title: "Borrado de datos" }

export default function DataDeletionPage() {
  return (
    <main className="mx-auto grid max-w-2xl gap-4 px-4 py-12 text-base leading-relaxed">
      <h1 className="text-xl">Cómo borrar tus datos</h1>
      <ol className="grid list-decimal gap-2 pl-5">
        <li>Mándale un mensaje directo a la cuenta de Instagram con la que interactuaste, con el texto «borrar mis datos».</li>
        <li>En un plazo de 30 días se borran tu identificador, tu nombre de usuario, tus mensajes, etiquetas y campos.</li>
        <li>Te confirmamos por el mismo chat cuando esté hecho.</li>
      </ol>
      <p>
        También puedes quitarle el acceso a la app desde Instagram: Configuración → Apps y sitios web → Activas → Quitar.
      </p>
    </main>
  )
}
