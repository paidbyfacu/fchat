import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de privacidad" }

export default function PrivacyPage() {
  return (
    <main className="mx-auto grid max-w-2xl gap-4 px-4 py-12 text-base leading-relaxed">
      <h1 className="text-xl">Política de privacidad</h1>
      <p>
        Esta app responde automáticamente comentarios y mensajes en las cuentas de Instagram de su dueño. Para eso guarda el
        identificador de Instagram de quien interactúa, su nombre de usuario, si sigue a la cuenta, los mensajes intercambiados y,
        si la persona lo escribe, su email.
      </p>
      <p>Los datos se usan solo para responder y para ver estadísticas propias. No se venden ni se comparten con terceros.</p>
      <p>
        Los accesos a Instagram se guardan cifrados. Los eventos crudos que manda Meta se borran a los 30 días.
      </p>
      <p>
        Para borrar tus datos, sigue los pasos de la <a className="text-link underline" href="/data-deletion">página de borrado de datos</a>.
      </p>
    </main>
  )
}
