// FChat terms and conditions, in both dashboard languages. The English text is the same as
// web/TERMS.md. If the substance of the text changes, bump TERMS_VERSION and update TERMS.md:
// every administrator accepts them again the next time they open the dashboard.

import type { Locale } from "@/lib/i18n/locale"

export const TERMS_VERSION = "2026-11-22"

export type TermsSection = { title: string; body: string[] }

export type Terms = {
  /** Date of the current version, written out. */
  date: string
  /** Label before the date. */
  updated: string
  /** The most important points, in three lines, to read before accepting. */
  highlights: string[]
  sections: TermsSection[]
}

const es: Terms = {
  date: "22 de noviembre de 2026",
  updated: "Última actualización:",
  highlights: [
    "Es gratis y de código abierto, pero no puedes venderlo ni cobrar por él.",
    "Tu instalación, tus cuentas y lo que envías quedan bajo tu responsabilidad.",
    "FChat no responde por baneos, bloqueos ni por el mal uso de la plataforma.",
  ],
  sections: [
    {
      title: "Qué es FChat",
      body: [
        "FChat by paidbyfacu es un software de código abierto para automatizar mensajes de Instagram: cuando alguien comenta una palabra en una publicación, recibe un mensaje directo con lo que configuraste.",
        "FChat no es un servicio que alguien te preste. Es un programa que tú instalas y ejecutas en tu propio servidor, como tu cuenta de Vercel, con tu propia base de datos y tu propia app de Meta.",
      ],
    },
    {
      title: "Licencia y prohibición de venta",
      body: [
        "FChat se distribuye con la licencia MIT junto con la condición Commons Clause. Puedes usarlo, copiarlo, modificarlo y compartirlo gratis, para tus cuentas y para tu propio negocio.",
        "No puedes venderlo ni comercializarlo. Eso incluye cobrar por el software o por una copia modificada, revenderlo, ofrecerlo como un servicio pago a terceros o cobrar por instalarlo, alojarlo o darle soporte cuando el valor principal de lo que cobras es FChat.",
        "Cada copia de FChat tiene que conservar el aviso de la licencia y estos términos.",
      ],
    },
    {
      title: "Tu instalación es tuya",
      body: [
        "Tú creas la cuenta de administrador, tú eliges dónde se instala y tú conectas tus redes. Eres el único responsable de esa instalación: de mantenerla segura, de las contraseñas, de los accesos que das y de lo que se envía desde ella.",
        "Si compartes el acceso con otras personas, lo que hagan también queda bajo tu responsabilidad.",
      ],
    },
    {
      title: "Sin garantías",
      body: [
        "FChat se entrega tal como está, sin garantías de ningún tipo: ni de que funcione sin errores, ni de que siga funcionando si Meta, Instagram, Vercel u otro proveedor cambian sus reglas o sus servicios, ni de que sirva para un fin en particular.",
      ],
    },
    {
      title: "Límite de responsabilidad",
      body: [
        "Ni FChat, ni paidbyfacu, ni quienes contribuyen al código se hacen responsables de ningún daño o pérdida que surja de usarlo o de no poder usarlo.",
        "Eso incluye, entre otros: suspensiones, bloqueos, restricciones o baneos de tus cuentas de Instagram, Facebook, Meta, TikTok u otras plataformas; límites o rechazos de la API; mensajes que no llegan o llegan de más; pérdida de datos, de seguidores, de ventas o de ingresos; y cualquier mal uso de la plataforma, tuyo o de terceros.",
      ],
    },
    {
      title: "Uso aceptable",
      body: [
        "Te comprometes a usar FChat respetando las condiciones y políticas de cada plataforma que conectes, en especial las Políticas de la Plataforma de Meta y las Normas comunitarias de Instagram, y las leyes de tu país.",
        "No lo uses para enviar spam, mensajes que nadie pidió, engaños, contenido ilegal o cualquier cosa que moleste o ponga en riesgo a otras personas.",
      ],
    },
    {
      title: "Plataformas de terceros",
      body: [
        "FChat se conecta con servicios de terceros, como Instagram, Meta y Vercel, a través de sus APIs oficiales y con tu propia app de desarrollador. Esos servicios tienen sus propios términos, que también aceptas al usarlos.",
        "FChat no está afiliado, respaldado ni patrocinado por Meta, Instagram, TikTok, Vercel ni ManyChat. Todas esas marcas pertenecen a sus dueños.",
      ],
    },
    {
      title: "Tus datos",
      body: [
        "Los datos de tus contactos, mensajes y cuentas se guardan solo en la base de datos de tu instalación. paidbyfacu no los recibe, no los ve y no los guarda.",
        "Tú eres el responsable de tratar esos datos según las leyes de protección de datos que te apliquen y de atender los pedidos de las personas que quieran que borres los suyos.",
      ],
    },
    {
      title: "Actualizaciones automáticas",
      body: [
        "Si las activas, tu copia de FChat se actualiza sola con las versiones nuevas del repositorio oficial. Cada versión puede cambiar, agregar o quitar funciones. Puedes desactivarlas cuando quieras, y revisar cada cambio en GitHub antes de que llegue.",
      ],
    },
    {
      title: "Propiedad intelectual",
      body: [
        "El código de FChat es abierto en los términos de su licencia. Los nombres y logos de FChat y paidbyfacu están reservados: no puedes usarlos para presentar como oficial una copia modificada ni para promocionar otro producto o servicio.",
      ],
    },
    {
      title: "Cambios en estos términos",
      body: [
        "Estos términos pueden cambiar con una versión nueva de FChat. Si cambian, el panel te pedirá que los vuelvas a aceptar antes de seguir usándolo.",
      ],
    },
    {
      title: "Aceptación",
      body: [
        "Al crear tu cuenta de administrador o al tocar «Acepto», confirmas que leíste estos términos, que los entiendes y que los aceptas. Si no estás de acuerdo, no instales ni uses FChat.",
      ],
    },
  ],
}

const en: Terms = {
  date: "November 22, 2026",
  updated: "Last updated",
  highlights: [
    "It is free and open source, but you may not sell it or charge for it.",
    "Your installation, your accounts and what you send are your responsibility.",
    "FChat is not liable for bans, blocks or misuse of the platform.",
  ],
  sections: [
    {
      title: "What FChat is",
      body: [
        "FChat by paidbyfacu is open-source software that automates Instagram messages: when someone comments a keyword on a post, they receive a direct message with whatever you set up.",
        "FChat is not a service provided to you by anyone. It is a program you install and run on your own server, such as your Vercel account, with your own database and your own Meta app.",
      ],
    },
    {
      title: "License and no-sale condition",
      body: [
        "FChat is distributed under the MIT license together with the Commons Clause condition. You may use, copy, modify and share it for free, for your own accounts and for your own business.",
        "You may not sell it or commercialize it. That includes charging for the software or for a modified copy, reselling it, offering it as a paid service to third parties, or charging to install, host or support it when the main value of what you charge for is FChat.",
        "Every copy of FChat must keep the license notice and these terms.",
      ],
    },
    {
      title: "Your installation is yours",
      body: [
        "You create the administrator account, you choose where it is installed and you connect your social accounts. You are solely responsible for that installation: for keeping it secure, for its passwords, for the access you grant and for everything sent from it.",
        "If you share access with other people, what they do is also your responsibility.",
      ],
    },
    {
      title: "No warranty",
      body: [
        "FChat is provided as is, without warranties of any kind: not that it works without errors, not that it keeps working if Meta, Instagram, Vercel or any other provider changes its rules or services, and not that it is fit for any particular purpose.",
      ],
    },
    {
      title: "Limitation of liability",
      body: [
        "Neither FChat, nor paidbyfacu, nor the people who contribute to its code are liable for any damage or loss arising from using it or from being unable to use it.",
        "That includes, among others: suspensions, blocks, restrictions or bans of your Instagram, Facebook, Meta, TikTok or other accounts; API limits or rejections; messages that are not delivered or are delivered more than once; loss of data, followers, sales or revenue; and any misuse of the platform, by you or by third parties.",
      ],
    },
    {
      title: "Acceptable use",
      body: [
        "You agree to use FChat in accordance with the terms and policies of every platform you connect, especially the Meta Platform Terms and Developer Policies and the Instagram Community Guidelines, and with the laws of your country.",
        "Do not use it to send spam, unsolicited messages, scams, illegal content or anything that harms or endangers other people.",
      ],
    },
    {
      title: "Third-party platforms",
      body: [
        "FChat connects to third-party services, such as Instagram, Meta and Vercel, through their official APIs and your own developer app. Those services have their own terms, which you also accept by using them.",
        "FChat is not affiliated with, endorsed by or sponsored by Meta, Instagram, TikTok, Vercel or ManyChat. All those trademarks belong to their owners.",
      ],
    },
    {
      title: "Your data",
      body: [
        "Your contacts, messages and account data are stored only in your installation's database. paidbyfacu does not receive, see or store them.",
        "You are responsible for handling that data under the data protection laws that apply to you, and for responding to requests from people who want their data deleted.",
      ],
    },
    {
      title: "Automatic updates",
      body: [
        "If you turn them on, your copy of FChat updates itself with new versions from the official repository. Each version may change, add or remove features. You can turn them off at any time, and review every change on GitHub before it reaches you.",
      ],
    },
    {
      title: "Intellectual property",
      body: [
        "FChat's code is open under the terms of its license. The FChat and paidbyfacu names and logos are reserved: you may not use them to present a modified copy as official or to promote another product or service.",
      ],
    },
    {
      title: "Changes to these terms",
      body: [
        "These terms may change with a new version of FChat. If they change, the dashboard will ask you to accept them again before you keep using it.",
      ],
    },
    {
      title: "Acceptance",
      body: [
        "By creating your administrator account or clicking \"I accept\", you confirm that you have read, understood and accepted these terms. If you do not agree, do not install or use FChat.",
      ],
    },
  ],
}

export const TERMS: Record<Locale, Terms> = { es, en }
