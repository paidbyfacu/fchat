import { redirect } from "next/navigation"

// Las cuentas conectadas y la guía de Meta viven en Vincula tus redes.
export default function InstagramSettingsPage() {
  redirect("/conectar")
}
