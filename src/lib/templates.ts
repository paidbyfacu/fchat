// Plantillas de automatización que se muestran en el inicio y en Automatizaciones › Plantillas.

export type TemplateIcon = "comment" | "follow" | "dm" | "story" | "sequence" | "live"

export type Template = {
  id: string
  title: string
  description: string
  channel: "instagram" | "tiktok"
  icon: TemplateIcon
  /** Lista para usar, o se muestra como Próximamente. */
  ready: boolean
  popular?: boolean
  href?: string
  /** Lo que hace, en pasos cortos, para la tarjeta de detalle. */
  steps: string[]
}

export const TEMPLATES: Template[] = [
  {
    id: "comentario-dm",
    title: "Enlaces de DM automáticos desde los comentarios",
    description: "Alguien comenta una palabra en tu reel o post y le llega un DM con tu link al instante.",
    channel: "instagram",
    icon: "comment",
    ready: true,
    popular: true,
    href: "/automations/new?plantilla=comentario-dm",
    steps: ["Elige el post o reel y la palabra clave", "Escribe el DM con su botón", "Pon el link que va a recibir"],
  },
  {
    id: "seguidores",
    title: "Consigue seguidores antes de dar el link",
    description: "Antes de mandar el link, pide que te sigan y revisa que lo hayan hecho. Sube seguidores con cada reel.",
    channel: "instagram",
    icon: "follow",
    ready: true,
    href: "/automations/new?plantilla=seguidores",
    steps: ["Igual que la anterior", "Activa «Pedir que te sigan»", "El link llega solo a quien te sigue"],
  },
  {
    id: "palabra-dm",
    title: "Responde cuando te escriben una palabra por DM",
    description: "Si alguien te manda «PRECIO» o «INFO» por mensaje directo, recibe la respuesta sola.",
    channel: "instagram",
    icon: "dm",
    ready: false,
    steps: ["Elige las palabras", "Escribe la respuesta", "Suma botones o links"],
  },
  {
    id: "historias",
    title: "Responde a quien reacciona a tus historias",
    description: "Cuando alguien responde una historia, le llega un DM con lo que prometiste en ella.",
    channel: "instagram",
    icon: "story",
    ready: false,
    steps: ["Elige la historia", "Escribe el DM", "Suma el link"],
  },
  {
    id: "secuencias",
    title: "Secuencias de mensajes",
    description: "Una serie de mensajes que salen sola en los días siguientes, para quien te escribió hace poco.",
    channel: "instagram",
    icon: "sequence",
    ready: false,
    href: "/automations/secuencias",
    steps: ["Elige quién entra", "Arma los mensajes y la espera entre cada uno", "Actívala"],
  },
  {
    id: "tiktok-comentarios",
    title: "Comentarios de TikTok a mensaje",
    description: "La misma automatización de comentarios, pero en tus videos de TikTok.",
    channel: "tiktok",
    icon: "comment",
    ready: false,
    steps: ["Conecta TikTok", "Elige el video y la palabra", "Escribe el mensaje"],
  },
]
