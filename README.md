# FChat by paidbyfacu

Automatizaciones de Instagram gratis y de código abierto. Alguien comenta una palabra en tu reel, le llega un mensaje directo con un botón, le pides que te siga y, cuando te sigue, recibe tu link.

Lo instalas en tu propia cuenta de Vercel, con tu propia app de Meta. No pagas una suscripción, nadie más ve tus datos y se actualiza solo.

[![Instalar en Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpaidbyfacu%2Ffchat&project-name=fchat&repository-name=fchat&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

## Qué hace

- **Comentario a DM.** Cuando alguien comenta una palabra clave, recibe un mensaje privado al instante. La palabra se reconoce igual con mayúsculas, minúsculas, con acento o sin acento.
- **En un post, en varios o en todos.** Eliges uno o varios posts o reels, cualquier post de la cuenta o el próximo que publiques.
- **Pedir que te sigan.** Antes de entregar el link, la app revisa si la persona te sigue. Si no, le pide que te siga y le muestra un botón «Siguiendo». Puedes exigir que te siga sí o sí, o pedírselo una cantidad de veces y después mandarle el link igual.
- **Respuesta pública bajo el comentario.** Hasta 10 variantes que se eligen al azar, para que Instagram no lo tome como spam.
- **Bandeja.** Todas tus conversaciones en un solo lugar: abiertas, cerradas, no leídas y favoritas, con recordatorios, notas internas y respuestas tuyas desde el panel.
- **Plantillas.** Eliges una plantilla, cambias la palabra y el link, y la activas.
- **Reintentos.** Si Instagram limita un envío, la app lo vuelve a intentar más tarde en el mismo paso, sin repetir mensajes.
- **Actualizaciones automáticas.** Cada versión nueva llega sola a tu Vercel.

Usa solo la API oficial de Instagram de Meta: la misma que usan las herramientas pagas. No entra con tu usuario y contraseña de Instagram ni simula a una persona. TikTok y las secuencias de mensajes llegan en una próxima versión.

## Qué necesitas

- Una cuenta de Instagram **profesional**, de empresa o de creador.
- Una cuenta de [GitHub](https://github.com) y una de [Vercel](https://vercel.com). El plan gratis de Vercel alcanza.
- Una cuenta de desarrollador en [Meta for Developers](https://developers.facebook.com), gratis. Se crea durante la guía.

No necesitas instalar nada en tu computadora ni escribir código.

## Instalación

Son unos 20 minutos en total. Los paneles de Meta y de Vercel cambian seguido: si un botón tiene otro nombre, busca el más parecido.

### 1. Toca «Instalar en Vercel»

1. Toca el botón de arriba y entra a Vercel con tu cuenta de GitHub.
2. Vercel te pide un nombre para tu repositorio: deja «fchat» o elige otro, y toca **Create**.
3. Cuando te ofrezca la base de datos de **Neon**, acéptala con el plan gratis. Ahí se guardan tus automatizaciones y contactos.
4. Espera a que termine el deploy, unos 3 minutos, y toca **Continue to Dashboard**.

No hace falta cargar variables de entorno: los secretos se generan solos la primera vez que abres FChat.

### 2. Crea tu cuenta de administrador

Abre la dirección de tu FChat, algo como `https://fchat-tu-usuario.vercel.app`, **apenas termine el deploy**. Aparece la pantalla de instalación:

1. Escribe tu nombre, tu email y una contraseña de 12 caracteres o más.
2. Lee y acepta los términos de uso.
3. Toca **Crear mi cuenta**.

Esa cuenta es la única que entra al panel. Después de crearla, la pantalla de instalación ya no aparece.

### 3. Vincula tus redes

Al crear la cuenta, FChat te lleva a **Vincula tus redes**: una guía de 7 pasos dentro del panel, con botones para copiar cada dato que pide Meta. Se marca sola a medida que avanzas:

1. Preparar tu Instagram.
2. Crear tu app en Meta.
3. Pegar en FChat el identificador y la clave de tu app.
4. Configurar el webhook.
5. Conectar tu cuenta de Instagram.
6. Publicar tu app de Meta.
7. Crear tu primera automatización y probarla.

La misma guía, con más detalle, está en [docs/configurar-meta.md](docs/configurar-meta.md).

### 4. Activa las actualizaciones automáticas

En FChat: **Ajustes** › **Actualizaciones** › **Activar en GitHub**. Se abre GitHub con el archivo de actualización ya escrito: toca **Commit changes** y otra vez **Commit changes**. Se hace una sola vez.

Desde ahí, cada 4 horas GitHub revisa si hay una versión nueva de FChat. Si la hay, la copia a tu repositorio y Vercel la publica sola en unos minutos. Tus datos no se tocan: viven en la base de datos, no en el código.

El botón de Vercel no copia la carpeta `.github` del repositorio. Por eso este paso se hace desde el panel.

### 5. Crea tu primera automatización

**Automatizaciones** › **Plantillas** › **Enlaces de DM automáticos desde los comentarios**: elige el post, la palabra y el link, y actívala. Pruébala comentando desde **otra cuenta** de Instagram: los comentarios de tu propia cuenta no disparan nada.

## Si olvidas tu contraseña

En Vercel › tu proyecto › **Settings** › **Environment Variables**, agrega `OWNER_EMAIL` con tu email y `OWNER_PASSWORD` con una contraseña nueva de 12 caracteres o más. Después ve a **Deployments** y vuelve a desplegar el último. Al arrancar, FChat pone esa contraseña y cierra todas las sesiones abiertas.

Mientras esas dos variables estén cargadas, la contraseña se cambia solo desde Vercel. Si las borras, vuelves a cambiarla desde **Ajustes** › **Seguridad**.

## Variables de entorno

Todas son opcionales. Sirven para quien prefiere configurar FChat desde Vercel en lugar de desde el panel.

| Variable | Para qué |
| --- | --- |
| `DATABASE_URL` | La base Postgres. La pone sola la base de Neon |
| `OWNER_EMAIL` y `OWNER_PASSWORD` | Crear o recuperar la cuenta de administrador sin la pantalla de instalación |
| `IG_APP_ID` y `IG_APP_SECRET` | Los datos de tu app de Meta, si no quieres pegarlos en el panel |
| `WEBHOOK_VERIFY_TOKEN` | El token de verificación del webhook. Sin ella, FChat genera uno y lo muestra en la guía |
| `SESSION_SECRET` | Firma las sesiones. Sin ella, se genera una y se guarda en la base |
| `TOKEN_ENC_KEY` | Cifra los accesos a Instagram: 32 bytes en base64. Sin ella, se genera una y se guarda en la base |
| `CRON_SECRET` | Protege `/api/cron`, la tarea diaria que renueva el acceso a Instagram |
| `PUBLIC_URL` | La dirección del panel, solo si usas un dominio propio. En Vercel se detecta sola |
| `IG_ACCESS_TOKEN` | Conectar Instagram con un token generado en Meta, sin el botón «Conectar Instagram» |
| `IG_API_VERSION` | Versión de la API de Instagram. Por defecto `v26.0` |

Si cargas `TOKEN_ENC_KEY` después de haber conectado Instagram, o la cambias, hay que volver a conectar la cuenta y volver a pegar la clave de tu app. Cada variable está explicada en [.env.example](.env.example).

## Correrlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
git clone https://github.com/paidbyfacu/fchat.git
cd fchat
npm install
cp .env.example .env.local
```

En `.env.local`, completa `PGLITE_DIR` con una carpeta fuera del proyecto, por ejemplo `C:/fchat-data`. Ahí se guarda la base local. Después:

```bash
npm run dev     # panel en http://localhost:3000
npm test        # pruebas
```

Abre `http://localhost:3000` y aparece la misma pantalla de instalación. Para que Meta llegue a tu computadora necesitas una dirección pública, por ejemplo un túnel de Cloudflare, y ponerla en `PUBLIC_URL`.

Para actualizar, en la carpeta de FChat corre `git pull` y `npm install`, y vuelve a arrancarlo.

## Cómo funciona por dentro

- **Next.js 16** con App Router, en funciones de Vercel. No hay un servidor prendido todo el día.
- El webhook guarda cada aviso de Meta, responde enseguida y lo procesa en la misma función.
- Una tarea diaria en `/api/cron` retoma reintentos pendientes y renueva el acceso a Instagram, que dura 60 días.
- **Postgres** en producción y **PGlite** en tu computadora. Las migraciones están en `db/migrations` y corren solas al arrancar.
- El motor de automatizaciones está en `src/server/engine`, y el workflow de actualización en `.github/workflows/actualizar-fchat.yml`.
- La versión sale de `version` en `package.json`: cada instalación la compara con la de este repositorio para avisar si hay una nueva.

## Seguridad

- Cada persona instala su propia copia: tus datos y tus accesos quedan en tu Vercel y tu base.
- Los accesos a Instagram y la clave de tu app se guardan cifrados y nunca llegan al navegador.
- Cerrar sesión, cerrar una sesión desde **Ajustes** › **Seguridad** o cambiar la contraseña anula esa sesión aunque alguien haya copiado la cookie.
- Con 5 contraseñas incorrectas, esa IP queda bloqueada 15 minutos. El freno usa la IP que informa Vercel: si lo instalas en otro hosting, revisa `clientIp` en `src/server/session.ts`.
- Cada aviso de Meta se verifica con la firma de la clave secreta de tu app.
- Crea tu cuenta de administrador apenas termine el deploy: hasta ese momento, quien abra la dirección puede crearla. Si al abrir tu FChat ya no aparece la pantalla de instalación y no fuiste tú, recupera el acceso con `OWNER_EMAIL` y `OWNER_PASSWORD` como en «Si olvidas tu contraseña».
- **Activa la verificación en dos pasos en Vercel, GitHub y Meta.** Quien entre a tu Vercel ve todas las variables.

Si encuentras una falla de seguridad, avísame por mensaje privado antes de publicarla.

## Buen uso

- La app cumple las reglas de Meta: una respuesta privada por comentario, dentro de los 7 días, y la ventana de 24 horas para seguir la conversación.
- Instagram castiga el spam, no la herramienta: varía los textos, no mandes mensajes a quien no interactuó y evita respuestas de solo emojis.
- Funciona para tus propias cuentas. Para manejar cuentas de otras personas, Meta pide revisar tu app con su proceso de App Review.

## Aviso

FChat es un proyecto independiente. No está afiliado ni respaldado por Meta, Instagram, TikTok ni ManyChat. Cada persona que lo instala es responsable de usarlo según las políticas de cada plataforma y las leyes de su país. FChat y paidbyfacu no se hacen responsables por bloqueos, suspensiones o baneos de cuentas, ni por el mal uso de la plataforma. Los términos completos se aceptan al instalar y están en `/terminos` de tu panel.

La página `/privacy` que trae cada instalación es un punto de partida: revísala y adáptala a tu caso.

## Licencia

[MIT con la condición Commons Clause](LICENSE). Puedes usarlo gratis, para tus cuentas y para tu negocio, cambiarlo y compartirlo. **No puedes venderlo ni comercializarlo**: ni cobrar por el software o por una copia modificada, ni ofrecerlo como un servicio pago, ni cobrar por instalarlo o alojarlo cuando lo que vendes es FChat. Los nombres y logos de FChat y paidbyfacu están reservados.

Si te sirvió, cuéntamelo en Instagram: [@paidbyfacu](https://instagram.com/paidbyfacu).
