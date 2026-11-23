// Automation templates shown on Home and in Automations › Templates.

import type { Locale } from "@/lib/i18n/locale"

export type TemplateIcon = "comment" | "follow" | "dm" | "story" | "sequence" | "live"

export type Template = {
  id: string
  title: string
  description: string
  channel: "instagram" | "tiktok"
  icon: TemplateIcon
  /** Ready to use, or shown as Coming soon. */
  ready: boolean
  popular?: boolean
  href?: string
  /** What it does, in short steps, for the detail card. */
  steps: string[]
}

type Text = Pick<Template, "title" | "description" | "steps">
type Def = Omit<Template, keyof Text> & { text: Record<Locale, Text> }

const DEFS: Def[] = [
  {
    id: "comentario-dm",
    channel: "instagram",
    icon: "comment",
    ready: true,
    popular: true,
    href: "/automations/new?plantilla=comentario-dm",
    text: {
      es: {
        title: "Enlaces de DM automáticos desde los comentarios",
        description: "Alguien comenta una palabra en tu reel o post y le llega un DM con tu link al instante.",
        steps: ["Elige el post o reel y la palabra clave", "Escribe el DM con su botón", "Pon el link que va a recibir"],
      },
      en: {
        title: "Auto-DM links from comments",
        description: "Someone comments a keyword on your reel or post and instantly gets a DM with your link.",
        steps: ["Choose the post or reel and the keyword", "Write the DM with its button", "Add the link they will get"],
      },
    },
  },
  {
    id: "seguidores",
    channel: "instagram",
    icon: "follow",
    ready: true,
    href: "/automations/new?plantilla=seguidores",
    text: {
      es: {
        title: "Consigue seguidores antes de dar el link",
        description: "Antes de mandar el link, pide que te sigan y revisa que lo hayan hecho. Sube seguidores con cada reel.",
        steps: ["Igual que la anterior", "Activa «Pedir que te sigan»", "El link llega solo a quien te sigue"],
      },
      en: {
        title: "Get followers before sending the link",
        description: "Before sending the link, ask people to follow you and check that they did. Grow your followers with every reel.",
        steps: ["Same as the previous one", "Turn on “Ask to follow”", "Only your followers get the link"],
      },
    },
  },
  {
    id: "palabra-dm",
    channel: "instagram",
    icon: "dm",
    ready: false,
    text: {
      es: {
        title: "Responde cuando te escriben una palabra por DM",
        description: "Si alguien te manda «PRECIO» o «INFO» por mensaje directo, recibe la respuesta sola.",
        steps: ["Elige las palabras", "Escribe la respuesta", "Suma botones o links"],
      },
      en: {
        title: "Reply when someone DMs you a keyword",
        description: "If someone sends you “PRICE” or “INFO” by direct message, they get the answer automatically.",
        steps: ["Choose the keywords", "Write the reply", "Add buttons or links"],
      },
    },
  },
  {
    id: "historias",
    channel: "instagram",
    icon: "story",
    ready: false,
    text: {
      es: {
        title: "Responde a quien reacciona a tus historias",
        description: "Cuando alguien responde una historia, le llega un DM con lo que prometiste en ella.",
        steps: ["Elige la historia", "Escribe el DM", "Suma el link"],
      },
      en: {
        title: "Reply to people who react to your stories",
        description: "When someone replies to a story, they get a DM with what you promised in it.",
        steps: ["Choose the story", "Write the DM", "Add the link"],
      },
    },
  },
  {
    id: "secuencias",
    channel: "instagram",
    icon: "sequence",
    ready: false,
    href: "/automations/secuencias",
    text: {
      es: {
        title: "Secuencias de mensajes",
        description: "Una serie de mensajes que salen sola en los días siguientes, para quien te escribió hace poco.",
        steps: ["Elige quién entra", "Arma los mensajes y la espera entre cada uno", "Actívala"],
      },
      en: {
        title: "Message sequences",
        description: "A series of messages that go out on their own over the next days, to people who wrote to you recently.",
        steps: ["Choose who enters", "Write the messages and the wait between each one", "Turn it on"],
      },
    },
  },
  {
    id: "tiktok-comentarios",
    channel: "tiktok",
    icon: "comment",
    ready: false,
    text: {
      es: {
        title: "Comentarios de TikTok a mensaje",
        description: "La misma automatización de comentarios, pero en tus videos de TikTok.",
        steps: ["Conecta TikTok", "Elige el video y la palabra", "Escribe el mensaje"],
      },
      en: {
        title: "TikTok comments to message",
        description: "The same comment automation, but on your TikTok videos.",
        steps: ["Connect TikTok", "Choose the video and the keyword", "Write the message"],
      },
    },
  },
]

/** The templates with their texts in one language. */
export function templates(locale: Locale): Template[] {
  return DEFS.map(({ text, ...d }) => ({ ...d, ...text[locale] }))
}
