import { defineMessages } from "../define"

/** Public privacy and data deletion pages, the ones Meta asks for. */
export const legal = defineMessages({
  es: {
    privacyTitle: "Política de privacidad",
    privacy1:
      "Esta app responde automáticamente comentarios y mensajes en las cuentas de Instagram de su dueño. Para eso guarda el identificador de Instagram de quien interactúa, su nombre de usuario, si sigue a la cuenta, los mensajes intercambiados y, si la persona lo escribe, su email.",
    privacy2: "Los datos se usan solo para responder y para ver estadísticas propias. No se venden ni se comparten con terceros.",
    privacy3: "Los accesos a Instagram se guardan cifrados. Los eventos crudos que manda Meta se borran a los 30 días.",
    privacy4: "Para borrar tus datos, sigue los pasos de la <a>página de borrado de datos</a>.",
    deletionTab: "Borrado de datos",
    deletionTitle: "Cómo borrar tus datos",
    deletion1: "Mándale un mensaje directo a la cuenta de Instagram con la que interactuaste, con el texto «borrar mis datos».",
    deletion2: "En un plazo de 30 días se borran tu identificador, tu nombre de usuario, tus mensajes, etiquetas y campos.",
    deletion3: "Te confirmamos por el mismo chat cuando esté hecho.",
    deletion4: "También puedes quitarle el acceso a la app desde Instagram: Configuración → Apps y sitios web → Activas → Quitar.",
  },
  en: {
    privacyTitle: "Privacy policy",
    privacy1:
      "This app automatically replies to comments and messages on its owner's Instagram accounts. To do that it stores the Instagram ID of whoever interacts, their username, whether they follow the account, the messages exchanged and, if the person writes it, their email.",
    privacy2: "The data is used only to reply and to see the owner's own statistics. It is not sold or shared with third parties.",
    privacy3: "Instagram access is stored encrypted. The raw events Meta sends are deleted after 30 days.",
    privacy4: "To delete your data, follow the steps on the <a>data deletion page</a>.",
    deletionTab: "Data deletion",
    deletionTitle: "How to delete your data",
    deletion1: "Send a direct message to the Instagram account you interacted with, with the text \"delete my data\".",
    deletion2: "Within 30 days your ID, your username, your messages, tags and fields are deleted.",
    deletion3: "We confirm it in the same chat when it is done.",
    deletion4: "You can also remove the app's access from Instagram: Settings → Apps and websites → Active → Remove.",
  },
})
