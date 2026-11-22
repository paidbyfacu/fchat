# Configurar tu app de Meta para FChat

Esta guía arma la app de Meta que conecta FChat con tu Instagram. Es la misma que ves en tu panel, en **Vincula tus redes**, con más detalle. La app es tuya: Meta te da acceso a tu propia cuenta sin pasar por App Review.

En el panel, cada dato que tienes que pegar en Meta tiene un botón **Copiar** y ya viene con la dirección de tu FChat. Acá aparece como `https://tu-fchat.vercel.app`: cámbiala por la tuya.

Los paneles de Meta cambian seguido. Si un botón tiene otro nombre, busca el más parecido.

## 1. Prepara tu Instagram

- Tu cuenta de Instagram tiene que ser **profesional**, de empresa o de creador. Se cambia en la app de Instagram, en Configuración › Tipo de cuenta y herramientas.
- En la app de Instagram, desde tu cuenta: Configuración › Mensajes y respuestas a historias › Controles de mensajes › Herramientas conectadas › activa **Permitir acceso a los mensajes**.
- Ten a mano una **segunda cuenta de Instagram** para probar. Puede ser de alguien de confianza o una cuenta tuya secundaria.

## 2. Crea tu app en Meta

1. Entra a [developers.facebook.com/apps](https://developers.facebook.com/apps/). Si es la primera vez, Meta te pide registrarte como desarrollador: es gratis.
2. Toca **Crear app**.
3. Nombre: cualquiera que no use «Instagram» ni «Meta», por ejemplo «Mis respuestas».
4. Caso de uso: **Administrar mensajes y contenido en Instagram**.
5. Si te pide un portfolio comercial, puedes saltear ese paso.

## 3. Pega los datos de tu app en FChat

En tu app de Meta: **Casos de uso** › **Administrar mensajes y contenido en Instagram** › **Configuración de la API con inicio de sesión con Instagram**.

Copia estos dos datos y pégalos en FChat, en el paso 3 de **Vincula tus redes**:

- **Identificador de la app de Instagram**: un número largo.
- **Clave secreta de la app de Instagram**: toca **Mostrar** para verla.

Ojo: es el identificador de la app **de Instagram**, que aparece en esa pantalla. No es el identificador de la app de Meta que se ve arriba de todo.

FChat guarda la clave cifrada en tu base de datos. Si prefieres, puedes cargarlos en Vercel como `IG_APP_ID` e `IG_APP_SECRET`: las variables tienen prioridad sobre lo que pegues en el panel.

## 4. Configura el webhook

El webhook es la dirección a la que Meta avisa cada comentario y cada mensaje. En la misma pantalla de Meta, en **Configurar webhooks**:

1. **URL de devolución de llamada:** `https://tu-fchat.vercel.app/webhook`
2. **Token de verificación:** el que muestra FChat en el paso 4 de la guía. Cópialo con el botón, sin espacios.
3. Toca **Verificar y guardar**. Cuando Meta lo verifica, el paso se marca solo en FChat.
4. Suscríbete a los campos **comments**, **messages** y **messaging_postbacks**.

Si falla la verificación: revisa que la dirección termine en `/webhook`, que el token sea idéntico y que tu FChat abra en el navegador.

## 5. Conecta tu cuenta de Instagram

1. En la misma pantalla de Meta, busca **Configurar el inicio de sesión para empresas de Instagram**.
2. En **URL de redireccionamiento de OAuth válidas**, pega `https://tu-fchat.vercel.app/api/instagram/callback` y guarda.
3. En FChat, toca **Conectar Instagram**, entra con tu cuenta y acepta los permisos.

Al volver, tu cuenta aparece en **Vincula tus redes** como conectada. FChat renueva el acceso solo cada día.

**Si el botón no funciona:** en Meta, en **Generar tokens de acceso**, agrega tu cuenta y genera un token. Pégalo en Vercel › tu proyecto › **Settings** › **Environment Variables** como `IG_ACCESS_TOKEN` y vuelve a desplegar. FChat lo importa al arrancar.

## 6. Publica tu app

En modo Desarrollo, Meta no avisa los comentarios de gente que no tiene un rol en la app. Por eso hay que publicarla.

1. **Configuración de la app** › **Básica**:
   - **URL de la política de privacidad:** `https://tu-fchat.vercel.app/privacy`
   - **URL de eliminación de datos:** `https://tu-fchat.vercel.app/data-deletion`
   - Una categoría y un ícono.
2. Arriba, cambia el modo de la app a **Publicado** o Live.

Si Meta te pide confirmar tu cuenta o verificar algo, hazlo: mientras tanto puede responder «API access blocked». Suele resolverse solo en unas horas.

## 7. Crea tu primera automatización y pruébala

1. En FChat: **Automatizaciones** › **Plantillas** › **Enlaces de DM automáticos desde los comentarios**.
2. Elige el post, una palabra, por ejemplo `LINK`, y tu link. Actívala.
3. Desde tu **segunda cuenta**, comenta `link` en ese post.
4. Tiene que llegarte el mensaje con el botón. Tócalo y sigue los pasos. La conversación aparece en la **Bandeja** de FChat.

Si no llega nada:

- Revisa que la automatización esté **activa** y en el post correcto.
- Los comentarios de tu propia cuenta no disparan automatizaciones.
- En Vercel › tu proyecto › **Logs**, mira si llegó el aviso de Meta al comentar.
- Si no llegó nada, revisa la URL del webhook, los campos suscritos y que la app esté publicada.

## Límites de Instagram que conviene saber

- Se puede mandar **un mensaje privado por comentario**, dentro de los 7 días.
- Después, la conversación sigue solo si la persona responde o toca un botón, y dentro de las 24 horas.
- Para saber si alguien te sigue, Instagram exige que esa persona haya tocado algo antes. Por eso el primer mensaje lleva un botón.
- El acceso a Instagram dura 60 días. FChat lo renueva solo cada día con la tarea de `/api/cron`.
