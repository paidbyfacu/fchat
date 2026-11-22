/** Adónde volver después de entrar. Solo rutas internas: nada de //sitio.com, /\sitio.com ni espacios que el navegador limpia. */
export function safeNext(next: string): string {
  return /^\/(?![/\\])[^\s\\]*$/.test(next) ? next : "/"
}
