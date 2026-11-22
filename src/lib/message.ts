// Límites de la API de Instagram (button template y quick replies).
export const LIMITS = {
  text: 640,
  buttons: 3,
  buttonTitle: 20,
  quickReplies: 13,
  quickReplyTitle: 20,
} as const

export type MessageButton =
  | { id: string; type: "postback"; title: string }
  | { id: string; type: "url"; title: string; url: string; track: boolean }
  | { id: string; type: "profile"; title: string }

export type Message = {
  text: string
  privateReply: boolean
  buttons: MessageButton[]
  quickReplies: { id: string; title: string }[]
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

/** Problemas que impiden publicar o que conviene avisar, en el orden en que se muestran. */
export function messageIssues(m: Message, { isFirst }: { isFirst: boolean }) {
  const errors: string[] = []
  const warnings: string[] = []
  if (!m.text.trim()) errors.push("El mensaje está vacío.")
  if (m.text.length > LIMITS.text) errors.push(`El texto supera los ${LIMITS.text} caracteres.`)
  if (m.buttons.length > LIMITS.buttons) errors.push(`Máximo ${LIMITS.buttons} botones.`)
  for (const b of m.buttons) {
    if (!b.title.trim()) errors.push("Hay un botón sin texto.")
    if (b.title.length > LIMITS.buttonTitle) warnings.push(`«${b.title}» puede verse cortado en Instagram.`)
    if (b.type === "url" && !isValidUrl(b.url)) errors.push(`«${b.title || "Link"}» no tiene una URL válida.`)
  }
  if (isFirst && !m.buttons.some((b) => b.type === "postback") && !m.quickReplies.length) {
    warnings.push("Sin un botón de respuesta no vas a poder seguir la conversación: los links no la abren.")
  }
  return { errors, warnings }
}
