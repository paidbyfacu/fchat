// El asistente "comentario → DM" (S05): su estado, valores por defecto y
// validación. Lo usan la pantalla (para avisar al escribir) y el servidor
// (para no publicar algo roto). Sin imports de servidor.

import { LIMITS, isValidUrl, type Message } from "./message"
import { normalizeKeyword } from "./keywords"

export type PostScope = "specific" | "any" | "next"

export type PickedPost = { id: string; caption?: string; thumbnail?: string; timestamp?: string; permalink?: string }

export type Wizard = {
  name: string
  accountId: string
  scope: PostScope
  /** posts elegidos cuando scope = specific (uno o varios) */
  posts: PickedPost[]
  match: "words" | "any"
  include: string[]
  exclude: string[]
  publicReplies: { on: boolean; texts: string[] }
  opening: { text: string; button: string }
  /** maxAsks 0: se lo pide hasta que siga, sin mandar el link a quien no sigue */
  askFollow: { on: boolean; text: string; button: string; maxAsks: number }
  link: { text: string; links: { title: string; url: string }[] }
}

export const MAX_POSTS = 30
export const MAX_PUBLIC_REPLIES = 10

export function defaultWizard(accountId: string): Wizard {
  return {
    name: "",
    accountId,
    scope: "specific",
    posts: [],
    match: "words",
    include: [],
    exclude: [],
    publicReplies: { on: true, texts: ["¡Te escribí por privado! 💌", "Listo, revisa tus mensajes 🙌", "Te mandé todo por DM ✨"] },
    opening: { text: "¡Hola! Vi tu comentario 🙌 Toca «Continuar» y te paso el recurso.", button: "Continuar" },
    askFollow: {
      on: true,
      text: "Antes de pasártelo: el recurso es para quienes me siguen. Sígueme y toca «Siguiendo» 💛",
      button: "Siguiendo",
      maxAsks: 0,
    },
    link: { text: "¡Listo! Aquí lo tienes 👇", links: [{ title: "Abrir link", url: "https://" }] },
  }
}

export type WizardIssue = { field: string; message: string }

export function validateWizard(w: Wizard): WizardIssue[] {
  const out: WizardIssue[] = []
  const add = (field: string, message: string) => out.push({ field, message })
  if (!w.name.trim()) add("name", "Ponle un nombre para reconocerla en la lista.")
  if (w.name.length > 80) add("name", "El nombre puede tener hasta 80 caracteres.")
  if (!w.accountId) add("accountId", "Elige la cuenta de Instagram.")
  if (w.scope === "specific" && w.posts.length === 0) add("posts", "Elige al menos un post o reel.")
  if (w.posts.length > MAX_POSTS) add("posts", `Hasta ${MAX_POSTS} posts por automatización.`)
  if (w.match === "words" && !w.include.some((k) => normalizeKeyword(k))) add("include", "Agrega al menos una palabra o elige «Cualquier comentario».")
  if (w.publicReplies.on) {
    const texts = w.publicReplies.texts.filter((t) => t.trim())
    if (!texts.length) add("publicReplies", "Escribe al menos una respuesta pública o apaga la opción.")
    if (texts.some((t) => t.length > 300)) add("publicReplies", "Cada respuesta pública puede tener hasta 300 caracteres.")
    if (texts.some((t) => !/[\p{Letter}\p{Number}]/u.test(t))) add("publicReplies", "Evita respuestas de solo emojis: Instagram las marca como spam.")
  }
  const text = (field: string, value: string, label: string) => {
    if (!value.trim()) add(field, `${label}: falta el texto.`)
    if (value.length > LIMITS.text) add(field, `${label}: Instagram acepta hasta ${LIMITS.text} caracteres.`)
  }
  const button = (field: string, value: string, label: string) => {
    if (!value.trim()) add(field, `${label}: el botón no tiene texto.`)
    if (value.length > LIMITS.buttonTitle) add(field, `${label}: el botón puede tener hasta ${LIMITS.buttonTitle} caracteres.`)
  }
  text("opening", w.opening.text, "Primer DM")
  button("opening", w.opening.button, "Primer DM")
  if (w.askFollow.on) {
    text("askFollow", w.askFollow.text, "Pedir que te sigan")
    button("askFollow", w.askFollow.button, "Pedir que te sigan")
    if (!Number.isInteger(w.askFollow.maxAsks) || w.askFollow.maxAsks < 0 || w.askFollow.maxAsks > 5) add("askFollow", "Elige «Hasta que me siga» o entre 1 y 5 veces.")
  }
  text("link", w.link.text, "DM con el link")
  if (w.link.links.length > LIMITS.buttons) add("link", `Hasta ${LIMITS.buttons} links.`)
  w.link.links.forEach((l, i) => {
    button("link", l.title, `Link ${i + 1}`)
    if (!isValidUrl(l.url) || l.url === "https://") add("link", `Link ${i + 1}: la URL tiene que empezar con https:// y ser completa.`)
  })
  return out
}

/** Los mensajes tal como los vería la persona, para la vista previa. */
export function previewMessages(w: Wizard): Message[] {
  const msgs: Message[] = [
    { text: w.opening.text, privateReply: true, buttons: [{ id: "yes", type: "postback", title: w.opening.button }], quickReplies: [] },
  ]
  if (w.askFollow.on) {
    msgs.push({
      text: w.askFollow.text,
      privateReply: false,
      buttons: [
        { id: "profile", type: "profile", title: "Ir al perfil" },
        { id: "done", type: "postback", title: w.askFollow.button },
      ],
      quickReplies: [],
    })
  }
  msgs.push({
    text: w.link.text,
    privateReply: false,
    buttons: w.link.links.map((l, i) => ({ id: `l${i}`, type: "url" as const, title: l.title, url: l.url, track: false })),
    quickReplies: [],
  })
  return msgs
}
