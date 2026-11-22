// Términos y condiciones de FChat. Si cambia el texto de fondo, sube TERMS_VERSION:
// cada administrador los vuelve a aceptar la próxima vez que entra al panel.

export const TERMS_VERSION = "2026-11-22"
export const TERMS_DATE = "22 de noviembre de 2026"

export type TermsSection = { title: string; body: string[] }

export const TERMS: TermsSection[] = [
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
]
