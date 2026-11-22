/** "Chrome en Windows", "Safari en iPhone"… a partir del user agent, para la lista de sesiones. */
export function deviceLabel(ua: string | null | undefined): string {
  if (!ua) return "Dispositivo desconocido"
  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "otro sistema"
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Instagram/.test(ua)
        ? "Instagram"
        : /Firefox\/|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Navegador"
  return `${browser} en ${os}`
}
