# FChat by paidbyfacu

Automatizaciones de Instagram gratis y de código abierto. Alguien comenta una palabra en tu reel, le llega un mensaje directo con un botón, le pides que te siga y, cuando te sigue, recibe tu link.

Lo instalas en tu propia cuenta de Vercel, con tu propia app de Meta. No pagas una suscripción y nadie más ve tus datos.

## Qué hace

- **Comentario a DM.** Cuando alguien comenta una palabra clave, recibe un mensaje privado al instante. La palabra se reconoce igual con mayúsculas, minúsculas, con acento o sin acento.
- **En un post, en varios o en todos.** Eliges uno o varios posts o reels, cualquier post de la cuenta o el próximo que publiques.
- **Pedir que te sigan.** Antes de entregar el link, la app revisa si la persona te sigue. Si no, le pide que te siga y le muestra un botón «Siguiendo». Puedes exigir que te siga sí o sí, o pedírselo una cantidad de veces y después mandarle el link igual.
- **Respuesta pública bajo el comentario.** Hasta 10 variantes que se eligen al azar, para que Instagram no lo tome como spam.
- **Bandeja y contactos.** Ves las conversaciones y la gente que interactuó.
- **Reintentos.** Si Instagram limita un envío, la app lo vuelve a intentar más tarde en el mismo paso, sin repetir mensajes.
- **Panel protegido.** Sesiones que puedes cerrar desde Ajustes › Seguridad, freno a los intentos de contraseña y accesos a Instagram cifrados en la base.

Usa solo la API oficial de Instagram de Meta: la misma que usan las herramientas pagas. No entra con tu usuario y contraseña de Instagram ni simula a una persona.

## Qué necesitas

- Una cuenta de Instagram **profesional**, de empresa o de creador.
- Una cuenta de desarrollador en [Meta for Developers](https://developers.facebook.com), gratis.
- Una cuenta de [GitHub](https://github.com) y una de [Vercel](https://vercel.com). El plan gratis de Vercel alcanza.
- Una base Postgres gratis de Neon, que se crea desde Vercel en un clic.

## Instalación paso a paso

Son unos 20 minutos. Los paneles de Meta cambian seguido: si un botón tiene otro nombre, busca el más parecido.

### 1. Prepara tu Instagram

En la app de Instagram, desde tu cuenta: Configuración › Mensajes y respuestas a historias › Controles de mensajes › Herramientas conectadas, y activa **Permitir acceso a los mensajes**.

### 2. Crea tu app de Meta

1. Entra a [developers.facebook.com](https://developers.facebook.com) › **Mis apps** › **Crear app**.
2. Elige el caso de uso **Administrar mensajes y contenido en Instagram**.
3. Ponle un nombre que no diga «Instagram» ni «Meta», por ejemplo «Mis respuestas».
4. Entra a **Configuración de la API con inicio de sesión con Instagram** y copia:
   - el **Identificador de la app de Instagram**, que va en `IG_APP_ID`;
   - la **Clave secreta de la app de Instagram**, que va en `IG_APP_SECRET`.

La guía detallada, con cada pantalla, está en [docs/configurar-meta.md](docs/configurar-meta.md).

### 3. Sube FChat a Vercel

1. Haz un fork de este repo, o descárgalo y súbelo a un repo tuyo de GitHub.
2. En Vercel: **Add New** › **Project** › importa tu repo.
3. Antes de desplegar, abre **Environment Variables** y carga las de la tabla de abajo.
4. Toca **Deploy**.
5. Cuando termine, ve a **Storage** › **Create Database** › **Neon** › conéctala al proyecto. Esa base deja la variable `DATABASE_URL` cargada sola.
6. Ve a **Deployments** y vuelve a desplegar el último para que tome la base.
7. Abre la dirección de producción, algo como `https://tu-proyecto.vercel.app`, y entra con `OWNER_EMAIL` y `OWNER_PASSWORD`.

### 4. Conecta Meta con tu FChat

En tu app de Meta, con la dirección de producción de Vercel:

| En el panel de Meta | Qué pegar |
| --- | --- |
| Webhooks › URL de devolución de llamada | `https://tu-proyecto.vercel.app/webhook` |
| Webhooks › Token de verificación | el mismo texto de `WEBHOOK_VERIFY_TOKEN` |
| Campos del webhook | `comments`, `messages` y `messaging_postbacks` |
| Inicio de sesión para empresas › URL de redireccionamiento | `https://tu-proyecto.vercel.app/api/instagram/callback` |
| Configuración básica › Política de privacidad | `https://tu-proyecto.vercel.app/privacy` |
| Configuración básica › Eliminación de datos | `https://tu-proyecto.vercel.app/data-deletion` |

Después, pasa la app de Meta a modo **Publicado** o Live. En modo Desarrollo, Meta no avisa los comentarios de gente que no tiene un rol en la app.

### 5. Conecta tu Instagram

En FChat: **Ajustes** › **Instagram** › **Conectar Instagram**, y entra con tu cuenta.

Otra forma: en el panel de Meta, genera un token para tu cuenta, pégalo en la variable `IG_ACCESS_TOKEN` de Vercel y vuelve a desplegar. La app lo importa y desde ahí lo renueva sola cada día.

### 6. Crea tu primera automatización

**Automatizaciones** › **Nueva**, o **Crear la primera**: elige el post, la palabra, los mensajes y el link, y actívala. Pruébala comentando desde **otra cuenta** de Instagram: los comentarios de tu propia cuenta no disparan nada.

## Variables de entorno

| Variable | Para qué | Cómo obtenerla |
| --- | --- | --- |
| `OWNER_EMAIL` | Tu email para entrar al panel | El que quieras |
| `OWNER_PASSWORD` | Tu contraseña del panel, mínimo 12 caracteres | `node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"` |
| `SESSION_SECRET` | Firma las sesiones | `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `TOKEN_ENC_KEY` | Cifra los accesos a Instagram | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `CRON_SECRET` | Protege la tarea diaria que renueva el acceso | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `IG_APP_ID` | Identificador de tu app de Instagram | Panel de Meta, paso 2 |
| `IG_APP_SECRET` | Clave secreta de tu app de Instagram | Panel de Meta, paso 2 |
| `WEBHOOK_VERIFY_TOKEN` | Confirma a Meta que el webhook es tuyo | Un texto al azar que inventas |
| `DATABASE_URL` | La base Postgres | La pone Neon sola al conectarla en Vercel |
| `PUBLIC_URL` | Opcional: la dirección del panel | Solo con dominio propio. En Vercel se detecta sola |
| `IG_ACCESS_TOKEN` | Opcional: conectar Instagram sin el botón | Panel de Meta, generar token |
| `IG_API_VERSION` | Opcional: versión de la API de Instagram | Por defecto `v26.0` |

Si no tienes Node instalado para generar los secretos, sirve cualquier generador de contraseñas largo, salvo `TOKEN_ENC_KEY`, que tiene que ser exactamente 32 bytes en base64.

## Correrlo en tu PC

```bash
npm install
cp .env.example .env.local   # complétalo; para la base usa PGLITE_DIR
npm run dev                  # panel en http://localhost:3000
npm test                     # pruebas
```

Para que Meta llegue a tu PC necesitas una dirección pública, por ejemplo un túnel de Cloudflare, y ponerla en `PUBLIC_URL`.

## Cómo funciona por dentro

- **Next.js 16** con App Router, en funciones de Vercel. No hay un servidor prendido todo el día.
- El webhook guarda cada aviso de Meta, responde enseguida y lo procesa en la misma función.
- Una tarea diaria en `/api/cron` retoma reintentos pendientes y renueva el acceso a Instagram, que dura 60 días.
- **Postgres** en producción y **PGlite** en tu PC. Las migraciones están en `db/migrations` y corren solas al arrancar.
- El motor de automatizaciones está en `src/server/engine`.

## Seguridad

- Cada persona instala su propia copia: tus datos y tus accesos quedan en tu Vercel y tu base.
- Los accesos a Instagram se guardan cifrados con `TOKEN_ENC_KEY` y nunca llegan al navegador.
- Cerrar sesión, cerrar una sesión desde Ajustes › Seguridad o cambiar `OWNER_PASSWORD` anula esa sesión aunque alguien haya copiado la cookie.
- Con 5 contraseñas incorrectas, esa IP queda bloqueada 15 minutos. El freno usa la IP que informa Vercel: si lo instalas en otro hosting, revisa `clientIp` en `src/server/session.ts`.
- Cada aviso de Meta se verifica con la firma de `IG_APP_SECRET`.
- **Activa la verificación en dos pasos en Vercel, GitHub y Meta.** Quien entre a tu Vercel ve todas las variables.

Si encuentras una falla de seguridad, avísame por mensaje privado antes de publicarla.

## Buen uso

- La app cumple las reglas de Meta: una respuesta privada por comentario, dentro de los 7 días, y la ventana de 24 horas para seguir la conversación.
- Instagram castiga el spam, no la herramienta: varía los textos, no mandes mensajes a quien no interactuó y evita respuestas de solo emojis.
- Funciona para tus propias cuentas. Para manejar cuentas de otras personas, Meta pide revisar tu app con su proceso de App Review.

## Aviso

FChat es un proyecto independiente. No está afiliado ni respaldado por Meta, Instagram ni ManyChat. Cada persona es responsable de usarlo según las políticas de Meta y las leyes de su país, y de publicar su propia política de privacidad: la página `/privacy` que trae es un punto de partida.

## Licencia

[MIT](LICENSE). Puedes usarlo, cambiarlo y compartirlo. Si te sirvió, cuéntamelo en Instagram: [@paidbyfacu](https://instagram.com/paidbyfacu).
