# Configurar tu app de Meta para FChat

Esta guía arma la app de Meta que conecta FChat con tu Instagram. La app es tuya: Meta te da acceso a tu propia cuenta sin pasar por App Review.

Los paneles de Meta cambian seguido. Si un botón tiene otro nombre, busca el más parecido.

## 0. Antes de empezar

- Tu cuenta de Instagram tiene que ser **profesional**, de empresa o de creador.
- En la app de Instagram, desde tu cuenta: Configuración › Mensajes y respuestas a historias › Controles de mensajes › Herramientas conectadas › activa **Permitir acceso a los mensajes**.
- Ten a mano una **segunda cuenta de Instagram** para probar. Puede ser de alguien de confianza o una cuenta tuya secundaria.

## 1. Crear la app

1. Entra a [developers.facebook.com](https://developers.facebook.com) › **Mis apps** › **Crear app**.
2. Caso de uso: **Administrar mensajes y contenido en Instagram**.
3. Nombre: cualquiera que no use «Instagram» ni «Meta», por ejemplo «Mis respuestas».
4. Si te pide un portfolio comercial, puedes saltear ese paso.

## 2. Datos para Vercel

En tu app: **Casos de uso** › **Administrar mensajes y contenido en Instagram** › **Configuración de la API con inicio de sesión con Instagram**.

Copia y guarda para las variables de Vercel:

- **Identificador de la app de Instagram** › `IG_APP_ID`
- **Clave secreta de la app de Instagram** › `IG_APP_SECRET`

Ojo: es el identificador de la app **de Instagram**, que aparece en esa pantalla. No es el identificador de la app de Meta que se ve arriba de todo.

Con esos dos datos ya puedes desplegar FChat en Vercel, como explica el README. Vuelve acá cuando tengas la dirección de producción, por ejemplo `https://tu-proyecto.vercel.app`.

## 3. Webhooks

En la misma pantalla, en **Configurar webhooks**:

1. **URL de devolución de llamada:** `https://tu-proyecto.vercel.app/webhook`
2. **Token de verificación:** el mismo texto que pusiste en `WEBHOOK_VERIFY_TOKEN`.
3. Toca **Verificar y guardar**. Si falla, revisa que el deploy esté terminado y que el token sea idéntico, sin espacios.
4. Suscríbete a los campos **comments**, **messages** y **messaging_postbacks**.

## 4. Inicio de sesión con Instagram

Para que funcione el botón **Conectar Instagram** del panel:

1. En la misma pantalla, busca **Configurar el inicio de sesión para empresas de Instagram**.
2. En **URL de redireccionamiento de OAuth válidas**, pega `https://tu-proyecto.vercel.app/api/instagram/callback`.
3. Guarda.

Si prefieres no usar el botón: en **Generar tokens de acceso**, agrega tu cuenta, genera un token y pégalo en la variable `IG_ACCESS_TOKEN` de Vercel. Después vuelve a desplegar. Cuando la cuenta aparezca conectada, la app renueva el token sola.

## 5. Publicar la app

En modo Desarrollo, Meta no avisa los comentarios de gente que no tiene un rol en la app. Por eso hay que publicarla.

1. **Configuración de la app** › **Básica**:
   - **URL de la política de privacidad:** `https://tu-proyecto.vercel.app/privacy`
   - **URL de eliminación de datos:** `https://tu-proyecto.vercel.app/data-deletion`
   - Una categoría y un ícono.
2. Arriba, cambia el modo de la app a **Publicado** o Live.

Si Meta te pide confirmar tu cuenta o verificar algo, hazlo: mientras tanto puede responder «API access blocked».

## 6. Probar

1. En FChat, crea una automatización con una palabra, por ejemplo `LINK`, y actívala.
2. Desde tu **segunda cuenta**, comenta `link` en ese post.
3. Tiene que llegarte el mensaje con el botón. Tócalo y sigue los pasos.

Si no llega nada:

- Revisa que la automatización esté **activa** y en el post correcto.
- En Vercel › tu proyecto › **Logs**, mira si llegó el aviso de Meta al comentar.
- Si no llegó nada, revisa la URL del webhook, los campos suscritos y que la app esté publicada.
- Los comentarios de tu propia cuenta no disparan automatizaciones.

## Límites de Instagram que conviene saber

- Se puede mandar **un mensaje privado por comentario**, dentro de los 7 días.
- Después, la conversación sigue solo si la persona responde o toca un botón, y dentro de las 24 horas.
- Para saber si alguien te sigue, Instagram exige que esa persona haya tocado algo antes. Por eso el primer mensaje lleva un botón.
- El acceso a Instagram dura 60 días. FChat lo renueva solo cada día con la tarea de `/api/cron`.
