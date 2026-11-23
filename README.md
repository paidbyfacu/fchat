# FChat by paidbyfacu

Automatizaciones de Instagram gratis y de código abierto. Alguien comenta una palabra en tu reel, le llega un mensaje directo con un botón, le pides que te siga y, cuando te sigue, recibe tu link.

Lo instalas en tu propia cuenta de Vercel, con tu propia app de Meta. No pagas una suscripción, nadie más ve tus datos y se actualiza solo.

[![Instalar en Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpaidbyfacu%2Ffchat&project-name=fchat&repository-name=fchat&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

![Una conversación en la Bandeja de FChat: comentario, mensaje con botón, link y respuesta escrita desde el panel](docs/img/fchat-17-conversacion.webp)

## Contenido

- [Qué hace](#qué-hace)
- [Qué necesitas](#qué-necesitas)
- [Instalación paso a paso](#instalación-paso-a-paso)
  1. [Prepara tu Instagram](#paso-1-prepara-tu-instagram)
  2. [Instala FChat en Vercel](#paso-2-instala-fchat-en-vercel)
  3. [Crea tu cuenta de administrador](#paso-3-crea-tu-cuenta-de-administrador)
  4. [Conecta Instagram con Meta](#paso-4-conecta-instagram-con-meta)
  5. [Activa las actualizaciones automáticas](#paso-5-activa-las-actualizaciones-automáticas)
  6. [Crea tu primera automatización](#paso-6-crea-tu-primera-automatización)
  7. [Pruébala](#paso-7-pruébala)
- [Cómo se usa](#cómo-se-usa)
- [Tu proyecto en Vercel](#tu-proyecto-en-vercel)
  - [Ver los registros](#ver-los-registros)
  - [Cargar o cambiar una variable](#cargar-o-cambiar-una-variable)
  - [Volver a publicar](#volver-a-publicar)
  - [Tu dirección y un dominio propio](#tu-dirección-y-un-dominio-propio)
- [Si algo no funciona](#si-algo-no-funciona)
- [Si olvidas tu contraseña](#si-olvidas-tu-contraseña)
- [Variables de entorno](#variables-de-entorno)
- [Correrlo en tu computadora, en Windows o Mac](#correrlo-en-tu-computadora-en-windows-o-mac)
- [Cómo funciona por dentro](#cómo-funciona-por-dentro)
- [Seguridad](#seguridad)
- [Buen uso](#buen-uso)
- [Aviso](#aviso)
- [Licencia](#licencia)

## Qué hace

- **Comentario a DM.** Cuando alguien comenta una palabra clave, recibe un mensaje privado al instante. La palabra se reconoce igual con mayúsculas, minúsculas, con acento o sin acento.
- **En un post, en varios o en todos.** Eliges uno o varios posts o reels, cualquier post de la cuenta o el próximo que publiques.
- **Pedir que te sigan.** Antes de entregar el link, la app revisa si la persona te sigue. Si no, le pide que te siga y le muestra un botón «Siguiendo». Puedes exigir que te siga sí o sí, o pedírselo una cantidad de veces y después mandarle el link igual.
- **Respuesta pública bajo el comentario.** Hasta 10 variantes que se eligen al azar, para que Instagram no lo tome como spam.
- **Bandeja.** Todas tus conversaciones en un solo lugar: abiertas, cerradas, no leídas y favoritas, con recordatorios, notas internas y respuestas tuyas desde el panel.
- **Plantillas.** Eliges una plantilla, cambias la palabra y el link, y la activas.
- **Estadísticas.** Cuántos comentaron, cuántos recibieron el mensaje, tocaron el botón, te siguieron y recibieron el link.
- **Reintentos.** Si Instagram limita un envío, la app lo vuelve a intentar más tarde en el mismo paso, sin repetir mensajes.
- **Actualizaciones automáticas.** Cada versión nueva llega sola a tu Vercel.

Usa solo la API oficial de Instagram de Meta: la misma que usan las herramientas pagas. No entra con tu usuario y contraseña de Instagram ni simula a una persona. TikTok y las secuencias de mensajes llegan en una próxima versión.

## Qué necesitas

- Una cuenta de Instagram **profesional**, de empresa o de creador. Se cambia gratis desde la app de Instagram.
- Una **segunda cuenta de Instagram** para probar: tuya o de alguien de confianza.
- Una cuenta de [GitHub](https://github.com). La de [Vercel](https://vercel.com) se crea durante la instalación, entrando con GitHub. El plan gratis de Vercel, **Hobby**, alcanza.
- Una cuenta de Facebook para entrar a [Meta for Developers](https://developers.facebook.com). La cuenta de desarrollador es gratis y se crea durante la guía.

No necesitas instalar nada en tu computadora ni escribir código. Todo se hace desde el navegador, así que los pasos son los mismos en **Windows** y en **Mac**. Chrome, Edge, Safari o Firefox sirven igual.

## Instalación paso a paso

Son unos 30 minutos en total y se hace una sola vez. Los paneles de Meta, Vercel y GitHub cambian seguido: si un botón tiene otro nombre o está en otro lugar, busca el más parecido.

### Paso 1. Prepara tu Instagram

En la app de Instagram del teléfono, con la cuenta que quieres automatizar:

1. Pásala a **profesional**: **Configuración** › **Tipo de cuenta y herramientas** › **Cambiar a cuenta profesional**. Elige empresa o creador.
2. Permite el acceso a los mensajes: **Configuración** › **Mensajes y respuestas a historias** › **Controles de mensajes** › **Herramientas conectadas** › activa **Permitir acceso a los mensajes**.

### Paso 2. Instala FChat en Vercel

[Vercel](https://vercel.com) es el servicio donde vive tu FChat: lo publica en internet y le da una dirección. Su plan gratis se llama **Hobby** y alcanza: no hace falta pagar el plan Pro.

Las pantallas de Vercel están en inglés. En esta guía cada botón aparece con su nombre exacto, tal como lo vas a ver.

#### 2.1. Crea tu cuenta de Vercel

Si ya tienes cuenta en Vercel, entra con ella y sigue en el punto 2.2.

1. Toca el botón **Instalar en Vercel** de arriba. Sin sesión iniciada, Vercel muestra «Your first deploy is just a sign-up away.»
2. Toca **Continue with GitHub** y entra con tu cuenta de GitHub. Con ese permiso, Vercel crea tu copia de FChat en tu GitHub y la vuelve a publicar cada vez que cambia.
3. La primera vez, GitHub te pide autorizar a Vercel para usar tu cuenta: acéptalo.

<img src="docs/img/vercel-01-registro.webp" alt="Pantalla para crear la cuenta de Vercel, con el botón Continue with GitHub" width="420">

#### 2.2. Crea tu copia de FChat

Al entrar se abre **New Project**, con «Cloning from GitHub paidbyfacu/fchat». Vercel copia FChat a un repositorio nuevo en tu GitHub: desde ahí lo publica y lo actualiza.

1. **Git Scope:** tu cuenta de GitHub. Ahí se crea el repositorio.
2. **Private Repository Name:** el nombre de tu copia. Deja «fchat» o elige otro.
3. El candado al lado del nombre decide quién ve el repositorio. Cerrado, es privado y solo lo ves tú. Si lo tocas, se abre, el título cambia a **Public Repository Name** y cualquiera puede ver el código. Las dos opciones funcionan, porque tus datos y tus claves nunca van al repositorio. Si no sabes cuál elegir, déjalo privado.
4. **Vercel Team:** tu equipo de Vercel, con la etiqueta **Hobby**, el plan gratis. Déjalo como está.
5. Toca **Create**.

<img src="docs/img/vercel-02-clonar.webp" alt="New Project en Vercel: Git Scope, Private Repository Name con el candado cerrado, Vercel Team y Create" width="640">

Así se ve con el candado abierto, si eliges un repositorio público:

<img src="docs/img/vercel-03-repositorio-publico.webp" alt="New Project con el candado abierto y el título Public Repository Name" width="640">

#### 2.3. Agrega la base de datos Neon

FChat guarda tus automatizaciones, contactos y conversaciones en una base de datos Postgres de Neon. Vercel la crea dentro de tu cuenta: no hace falta abrir una cuenta aparte en Neon.

1. En **Add Products**, bajo «Install all the mandatory products», aparece **Neon**. Toca **Add**.

   <img src="docs/img/vercel-04-agregar-neon.webp" alt="Add Products en Vercel, con Neon y el botón Add" width="620">

2. Se abre el panel **Install Integration**. En **Region**, elige **Washington, D.C., USA (East)**: es donde Vercel corre tu FChat si no cambias nada, y con la base cerca responde más rápido.
3. **Auth** y **Realtime** pueden quedar como vienen: FChat no los usa.

   <img src="docs/img/vercel-05-neon-region.webp" alt="Panel Install Integration de Neon con la región, Auth y Realtime" width="420">

4. Más abajo, en **Installation Plan**, elige **Free**: «Neon's generous free tier, no credit card required.» Incluye 1 GB por proyecto, que alcanza de sobra. Toca **Continue**.

   <img src="docs/img/vercel-06-neon-plan.webp" alt="Plan Free de Neon y el botón Continue" width="420">

5. En **Confirmation** ves el nombre de la base en **Resource Name** y lo que elegiste. Toca **Create**.

   <img src="docs/img/vercel-07-neon-crear.webp" alt="Confirmación de la base de Neon con el botón Create" width="420">

6. Cuando aparece «Your Neon database is ready to use», toca **Done**.

   <img src="docs/img/vercel-08-neon-lista.webp" alt="Aviso Your Neon database is ready to use con el botón Done" width="420">

Vercel conecta la base con tu proyecto solo: carga `DATABASE_URL` y otras variables que empiezan con `POSTGRES_` o `PG`. No tienes que copiar nada.

Si tienes la verificación en dos pasos activa, Vercel puede pedirte el código en la ventana **Verify Your Identity**: escríbelo y toca **Verify Code**.

#### 2.4. Espera la publicación

Con la base lista, Vercel publica tu FChat. A esto se le llama deploy y tarda uno o dos minutos: en la prueba de esta guía tardó 49 segundos. Cuando termina aparece **Deployed to Production**.

Toca **Continue to Project** para ir al panel de tu proyecto. **Add Domain**, **Enable Speed Insights** y lo demás de esa pantalla son opcionales: FChat no los necesita.

<img src="docs/img/vercel-09-desplegado.webp" alt="Pantalla Deployed to Production con los botones Visit y Continue to Project" width="460">

#### 2.5. Abre tu FChat y guarda su dirección

En el panel del proyecto, la tarjeta **Production Deployment** muestra tu publicación con el estado **Ready**.

![Panel del proyecto en Vercel: Production Deployment, Domains y el botón Visit](docs/img/vercel-10-proyecto.webp)

- Bajo **Domains** está la dirección de tu FChat, algo como `tu-fchat.vercel.app`. Vercel la arma con el nombre del proyecto y, si ese nombre ya lo usa otra persona, le agrega algo al final.
- Toca **Visit** para abrir tu FChat y guárdalo en tus favoritos. Revisa que la dirección del navegador sea la misma de **Domains**.
- La misma dirección aparece en el menú de la izquierda, en **Domains**, con «Valid Configuration» y la etiqueta **Production**.

![Domains en Vercel con la dirección principal y Valid Configuration](docs/img/vercel-11-dominios.webp)

No hace falta cargar variables de entorno: los secretos se generan solos la primera vez que abres FChat.

#### Qué dirección usar

Tu FChat tiene una sola dirección principal: la de **Domains**. Es la que usas para entrar al panel y la que va en Meta.

- **Usa los botones Copiar de FChat.** En **Vincula tus redes**, cada dirección que pide Meta ya viene armada con tu dirección principal. Cópiala con su botón en lugar de escribirla a mano.
- **El webhook es tu dirección principal con `/webhook` al final:** `https://tu-fchat.vercel.app/webhook`. Con `https://` adelante, sin otra barra al final y sin espacios.
- **No uses la dirección larga.** Debajo de **Deployment**, Vercel muestra otra dirección, más larga, con letras al azar y el nombre de tu equipo, como `fchat-xxxxxxxxx-tu-equipo.vercel.app`. Vercel crea una nueva en cada publicación y la protege: quien la abre sin haber iniciado sesión en tu cuenta de Vercel ve **Log in to Vercel**. Meta tampoco puede entrar ahí, así que con esa dirección el webhook no funciona.

<img src="docs/img/vercel-12-direccion-larga.webp" alt="La dirección larga de un deploy pide Log in to Vercel" width="460">

### Paso 3. Crea tu cuenta de administrador

Abre tu FChat con **Visit** **apenas termine el deploy**. Aparece la pantalla de instalación:

![Pantalla de instalación de FChat: nombre, email, contraseña y términos](docs/img/fchat-01-instalacion.webp)

1. Escribe tu nombre, tu email y una contraseña de 12 caracteres o más.
2. Lee y acepta los términos de uso.
3. Toca **Crear mi cuenta**.

Esa cuenta es la única que entra al panel. Después de crearla, la pantalla de instalación ya no aparece.

### Paso 4. Conecta Instagram con Meta

Al crear la cuenta, FChat te lleva a **Vincula tus redes**: una guía de 7 pasos dentro del panel, con botones para copiar cada dato que pide Meta. Cada paso se marca solo cuando FChat detecta que lo hiciste.

![Vincula tus redes: la guía de 7 pasos dentro de FChat](docs/img/fchat-02-vincula-tus-redes.webp)

1. Preparar tu Instagram.
2. Crear tu app en Meta.
3. Pegar en FChat el identificador y la clave de tu app.
4. Configurar el webhook.
5. Conectar tu cuenta de Instagram.
6. Publicar tu app de Meta.
7. Crear tu primera automatización y probarla.

**La guía completa, con una captura de cada pantalla de Meta, está en [docs/configurar-meta.md](docs/configurar-meta.md).** Síguela con FChat abierto en una pestaña y Meta en otra. Tarda unos 15 minutos.

![Configuración de la API con inicio de sesión con Instagram, en el panel de Meta](docs/img/meta-07-datos-de-la-app.webp)

Cuando termines, FChat muestra «¡Instagram conectado!» y tu cuenta aparece como **Conectada**:

![Instagram conectado en FChat](docs/img/fchat-10-instagram-conectado.webp)

### Paso 5. Activa las actualizaciones automáticas

FChat se actualiza con un workflow de GitHub Actions: una tarea que GitHub corre sola en tu repositorio. El botón de Vercel no copia la carpeta `.github` del repositorio, por eso este paso se hace una vez desde el panel. Las pantallas de GitHub también están en inglés.

1. En FChat: **Ajustes** › **Actualizaciones**. Aparece «Activa las actualizaciones automáticas» con el botón **Activar en GitHub**.

   ![Ajustes › Actualizaciones con el botón Activar en GitHub](docs/img/fchat-21-actualizaciones.webp)

2. Toca **Activar en GitHub**. Se abre GitHub con el archivo `actualizar-fchat.yml` ya escrito, dentro de `.github/workflows` de tu repositorio. Si GitHub te pide iniciar sesión, entra con la misma cuenta que usaste en Vercel. No cambies nada del texto.
3. Arriba a la derecha, toca **Commit changes...**.

   ![Editor de GitHub con el archivo actualizar-fchat.yml y el botón Commit changes](docs/img/github-01-nuevo-archivo.webp)

4. En la ventana **Commit changes**, deja el mensaje como viene y marcada la opción **Commit directly to the main branch**. Toca **Commit changes**.

   <img src="docs/img/github-02-commit.webp" alt="Ventana Commit changes de GitHub con Commit directly to the main branch" width="420">

5. Vercel se vuelve a publicar solo. En unos minutos, **Ajustes** › **Actualizaciones** dice **Activas**.

   ![Actualizaciones automáticas activas](docs/img/fchat-22-actualizaciones-activas.webp)

Desde ahí, cada 4 horas GitHub revisa si hay una versión nueva de FChat. Si la hay, la copia a tu repositorio y Vercel la publica sola en unos minutos. Tus datos no se tocan: viven en la base de datos, no en el código.

#### Actualizar en el momento

En **Ajustes** › **Actualizaciones**, toca **Actualizar ahora**. Se abre la pestaña **Actions** de tu repositorio, en el workflow de FChat. Se llama **Actualizar FChat**, o **Update FChat** desde la versión 1.0.4.

1. Toca **Run workflow**.
2. En la ventana que se abre, deja **main** en «Use workflow from» y toca otra vez **Run workflow**.

![Workflow de FChat en GitHub Actions con el botón Run workflow](docs/img/github-03-run-workflow.webp)

La ejecución aparece en la lista de ese workflow. Si había una versión nueva, Vercel la publica en unos minutos.

#### Si cambias el código a mano

Cada actualización reemplaza el código de tu repositorio por el de FChat. Si cambiaste algo y quieres conservarlo, apaga el workflow: en la pestaña **Actions**, elige el workflow de FChat, toca el botón **...** al lado de **Run workflow** y después **Disable workflow**. GitHub pregunta «Disable workflow?»: toca otra vez **Disable workflow**.

![Menú del workflow con Disable workflow](docs/img/github-04-menu-workflow.webp)

#### Si GitHub pausa las actualizaciones

En un repositorio **público**, GitHub pausa las tareas programadas cuando el repositorio pasa 60 días sin cambios, y suele avisarte por email. Para reactivarlas, entra a la pestaña **Actions** de tu repositorio, elige el workflow de FChat y toca **Enable workflow**. Lo mismo sirve si lo apagaste a mano: en ese caso el aviso dice «This workflow was disabled manually.»

![Aviso de workflow desactivado con el botón Enable workflow](docs/img/github-05-enable-workflow.webp)

#### Si tu repositorio es privado

GitHub Actions es gratis en los repositorios públicos. En los privados, cada ejecución usa minutos de la cuota gratis mensual de tu cuenta de GitHub, y este workflow usa muy pocos. Si tu cuenta de GitHub tiene un pago rechazado o llegó a su límite de gasto, GitHub no arranca el workflow y muestra «The job was not started because recent account payments have failed or your spending limit needs to be increased.» Para que vuelva a correr, arregla la facturación de tu cuenta de GitHub o haz público el repositorio.

### Paso 6. Crea tu primera automatización

1. En FChat: **Automatizaciones** › **Plantillas**. Elige **Enlaces de DM automáticos desde los comentarios**, o **Consigue seguidores antes de dar el link** si quieres que te sigan antes de recibirlo.

   ![Plantillas de automatizaciones](docs/img/fchat-11-plantillas.webp)

2. Completa el asistente. A la derecha, la vista previa del teléfono muestra cómo lo va a ver la persona:
   - **Nombre:** solo lo ves tú, en la lista.
   - **Cuando alguien comenta en:** posts o reels que eliges, cualquier post o reel, o el próximo que publiques. Toca **Elegir posts** y marca uno o varios.
   - **Y el comentario tiene:** las palabras que lo activan, por ejemplo `LINK`. Escribe cada una y toca Enter. También puedes poner palabras que lo frenan.
   - **Responder también bajo el comentario:** las respuestas públicas, por ejemplo «¡Te escribí por privado!». Se elige una al azar cada vez.
   - **Primer DM:** el mensaje privado con su botón, por ejemplo «Continuar». El botón es obligatorio: sin un toque, Instagram no deja seguir la conversación.
   - **Pedir que te sigan:** el mensaje para quien no te sigue y cuántas veces se lo pide. Con **Hasta que me siga**, el link solo llega a quien te sigue.
   - **DM con el link:** el mensaje final, con el texto del botón y tu link.

   <img src="docs/img/fchat-13-elegir-post.webp" alt="Ventana para elegir los posts de la automatización" width="640">

   <img src="docs/img/fchat-12-asistente.webp" alt="Asistente completo de una automatización con la vista previa del teléfono" width="720">

3. Toca **Publicar**. Aparece el aviso «Automatización activa: ya responde comentarios».

   ![Automatización activa](docs/img/fchat-14-automatizacion-activa.webp)

Si prefieres dejarla para después, toca **Guardar borrador**.

### Paso 7. Pruébala

1. Desde tu **segunda cuenta** de Instagram, comenta la palabra en el post que elegiste, por ejemplo `link`. Los comentarios de tu propia cuenta no disparan nada.
2. A la segunda cuenta le llega el mensaje con el botón. Tócalo.
3. Si elegiste pedir que te sigan y esa cuenta no te sigue, le llega el pedido con el botón **Siguiendo**. Que te siga y lo toque.
4. Le llega el link. La conversación aparece en la **Bandeja** de FChat y los números, en la automatización.

Si no llega nada, mira [Si algo no funciona](#si-algo-no-funciona).

## Cómo se usa

### Inicio

Lo primero que ves al entrar: plantillas para empezar, los próximos pasos que te faltan y los números de los últimos 7 días.

<img src="docs/img/fchat-20-inicio.webp" alt="Inicio de FChat con plantillas, próximos pasos y los últimos 7 días" width="720">

### Automatizaciones y estadísticas

En **Automatizaciones** ves todas las tuyas, activas y en borrador. Al abrir una, ves cuántas personas pasaron por cada paso en los últimos 7 días y los mensajes que manda. Desde ahí la editas, la detienes o la eliminas.

![Lista de automatizaciones](docs/img/fchat-15-automatizaciones.webp)

![Estadísticas de una automatización](docs/img/fchat-19-estadisticas.webp)

### Bandeja

Todas tus conversaciones de Instagram. Filtra por abiertas, cerradas, no leídas o favoritas, y pon recordatorios. Al abrir una conversación ves el comentario, cada mensaje que mandó la automatización y lo que tocó la persona. A la derecha, sus datos y si te sigue. Puedes responderle a mano y dejar notas internas que solo ves tú.

![Bandeja de FChat](docs/img/fchat-16-bandeja.webp)

Así se ve una conversación completa: el comentario, el mensaje con su botón, el link y una respuesta escrita desde el panel.

![Una conversación abierta en la Bandeja](docs/img/fchat-17-conversacion.webp)

Instagram te deja responder a mano hasta 24 horas después del último mensaje de cada persona.

### Contactos

Todas las personas que interactuaron con tus automatizaciones: si te siguen, si tocaron un botón y si su ventana de 24 horas está abierta.

![Contactos de FChat](docs/img/fchat-18-contactos.webp)

### Ajustes

- **Redes conectadas:** tu cuenta de Instagram, para reconectarla o reactivar los webhooks.
- **Seguridad:** tu contraseña y las sesiones abiertas, que puedes cerrar desde ahí.
- **Actualizaciones:** la versión de FChat que tienes y las actualizaciones automáticas.
- **Términos y licencia:** lo que aceptaste al instalar.

## Tu proyecto en Vercel

Casi nunca hace falta entrar a Vercel después de instalar. Cuando haga falta, entra a [vercel.com](https://vercel.com), abre tu proyecto y usa el menú de la izquierda: **Deployments**, **Logs**, **Environment Variables** y **Domains** son las únicas secciones que usa esta guía. **Analytics**, **Speed Insights**, **Firewall** y las demás son opcionales: FChat no las necesita.

### Ver los registros

En **Logs** está cada pedido que recibe tu FChat y cada error. Sirve para saber si los avisos de Meta llegan.

![Logs de Vercel con el buscador y el botón Live](docs/img/vercel-13-logs.webp)

- Cada fila muestra la hora, la página que se pidió en **Source** y el mensaje. Cuando Meta manda un aviso, aparece una fila con `/webhook`.
- Escribe una palabra en **Search logs...** para filtrar, por ejemplo `webhook` o `error`.
- Toca **Live** para ver los registros en el momento, mientras pruebas un comentario.
- Por defecto se ven los últimos 30 minutos, «Last 30 minutes». En los filtros puedes elegir un período más largo y marcar solo los errores.

Las filas que dicen `[tls-profile] applied` son de Vercel y no indican ningún problema.

### Cargar o cambiar una variable

En **Environment Variables** están las variables de tu proyecto. Al instalar, Neon carga las suyas: `DATABASE_URL`, `POSTGRES_URL`, `PGHOST` y otras parecidas. Vercel puede marcar algunas con **Needs Attention**: es una sugerencia de Vercel para renovar claves, no un error de FChat. No las cambies ni las borres, porque FChat dejaría de ver tu base de datos.

![Environment Variables en Vercel, con las variables de Neon](docs/img/vercel-14-variables.webp)

Para agregar una variable, como `OWNER_PASSWORD` o `IG_ACCESS_TOKEN`:

1. Toca **Add Environment Variable**.
2. En **Type**, elige **Secret** para contraseñas, claves y tokens: después de guardarla no se puede volver a ver. Para lo que no es secreto, como tu email, elige **Config**.
3. En **Key**, escribe el nombre exacto de la variable, en mayúsculas, por ejemplo `IG_ACCESS_TOKEN`.
4. En **Value**, pega el valor sin espacios al principio ni al final. **Note (Optional)** puede quedar vacío.
5. Si necesitas otra variable, toca **Add new variable** y repite los pasos 3 y 4.
6. En **Environments** deja **Production** y toca **Save**.

<img src="docs/img/vercel-15-agregar-variable.webp" alt="Ventana Add Environment Variable con Type, Key, Value, Environments y Save" width="520">

Una variable nueva o cambiada no se aplica sola: después hay que [volver a publicar](#volver-a-publicar). Para cambiar o borrar una variable, toca el botón **...** de su fila.

### Volver a publicar

Vuelve a publicar después de cargar o cambiar una variable. Tus datos no se tocan.

1. Entra a **Deployments**. La primera fila es tu publicación actual, con **Ready** y la etiqueta **Production**.
2. Toca el botón **...** de esa fila y elige **Redeploy**.

   ![Deployments en Vercel con el menú de la publicación y la opción Redeploy](docs/img/vercel-17-menu-deployment.webp)

3. En la ventana **Redeploy**, deja **Production** en «Choose Environment». «Use existing Build Cache.» puede quedar como viene. Toca **Redeploy**.

   <img src="docs/img/vercel-18-redeploy.webp" alt="Ventana Redeploy con Production y el botón Redeploy" width="460">

4. Aparece una fila nueva arriba de todo en **Deployments**. En uno o dos minutos dice **Ready**, y desde ahí FChat usa las variables nuevas.

Cada actualización de FChat también suma una fila. La de arriba, con la etiqueta **Production** en azul, es la que está publicada:

![Deployments con varias publicaciones en Ready y la actual marcada Production](docs/img/vercel-16-deployments.webp)

En el menú **...** de cada fila, **Instant Rollback** vuelve a una publicación anterior si una actualización te da problemas. Con una sola publicación aparece en gris. Solo vuelve atrás el código: la base de datos queda como está.

El aviso «Deployment Retention is enabled for this project» es normal: Vercel borra con el tiempo las publicaciones viejas, nunca la actual.

### Tu dirección y un dominio propio

En **Domains** está la dirección de tu FChat. Si tienes un dominio propio y quieres usarlo, toca **Add Existing** y sigue los pasos de Vercel para conectarlo. Después:

1. [Vuelve a publicar](#volver-a-publicar).
2. Abre FChat con la dirección nueva y revisa que los botones Copiar de **Vincula tus redes** la muestren. Si siguen con la dirección vieja, carga `PUBLIC_URL` con la nueva, como `https://fchat.tudominio.com`, y vuelve a publicar.
3. En Meta, cambia la URL del webhook y la URL de redireccionamiento por las nuevas, como en [docs/configurar-meta.md](docs/configurar-meta.md).

## Si algo no funciona

| Qué pasa | Qué revisar |
| --- | --- |
| No llega el mensaje al comentar | Comenta desde **otra cuenta**. La automatización tiene que decir **Activa** y estar en ese post. La app de Meta tiene que estar **Publicada** y el webhook verificado. |
| Llega el primer mensaje pero el botón no hace nada | En Meta, **messaging_postbacks** tiene que estar en **Suscritos**. En Instagram, **Permitir acceso a los mensajes** tiene que estar activo. |
| Meta responde «API access blocked» | En Meta, revisa **Acciones requeridas** y la campana de avisos y completa lo que pida. Suele resolverse en unas horas. |
| El webhook no verifica | Usa la dirección de **Domains** con `/webhook` al final, no la dirección larga de un deploy. El token tiene que ser idéntico al de FChat. Mira [Qué dirección usar](#qué-dirección-usar). |
| Al abrir FChat aparece «Log in to Vercel» | Abriste la dirección larga de un deploy. Entra con la de **Domains**, como `tu-fchat.vercel.app`. |
| «Conectar Instagram» da error | Pegaste el identificador de la app **de Instagram**, no el de Meta, y guardaste la URL de redireccionamiento en Meta. Como respaldo, conéctalo con un token. |
| Le pide que te siga aunque ya te sigue | Que toque **Siguiendo** otra vez. Si nunca lo reconoce, cambia **Veces que se lo pide** a un número. |
| La pantalla de instalación ya no aparece y no creaste la cuenta | Recupera el acceso como en [Si olvidas tu contraseña](#si-olvidas-tu-contraseña). |

Cada caso está explicado con más detalle en [docs/configurar-meta.md](docs/configurar-meta.md#si-algo-no-funciona). En Vercel › tu proyecto › **Logs** ves cada aviso que llega de Meta y cada error: mira [Ver los registros](#ver-los-registros).

## Si olvidas tu contraseña

En Vercel › tu proyecto › **Environment Variables**, agrega dos variables, como en [Cargar o cambiar una variable](#cargar-o-cambiar-una-variable):

- `OWNER_EMAIL`, de tipo **Config**: el mismo email con el que creaste tu cuenta.
- `OWNER_PASSWORD`, de tipo **Secret**: una contraseña nueva de 12 caracteres o más. Si es más corta, FChat no la aplica y lo avisa en **Logs**.

Después [vuelve a publicar](#volver-a-publicar). Al arrancar, FChat pone esa contraseña y cierra todas las sesiones abiertas. Entra con tu email y la contraseña nueva.

Mientras esas dos variables estén cargadas, la contraseña se cambia solo desde Vercel. Si las borras, vuelves a cambiarla desde **Ajustes** › **Seguridad**.

## Variables de entorno

Todas son opcionales. Sirven para quien prefiere configurar FChat desde Vercel en lugar de desde el panel. Cómo cargarlas está en [Cargar o cambiar una variable](#cargar-o-cambiar-una-variable).

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

## Correrlo en tu computadora, en Windows o Mac

Para usar FChat no hace falta: la instalación en Vercel es la recomendada. Esto sirve para probar cambios en el código.

Necesitas [Node.js](https://nodejs.org) 20 o más nuevo, mejor la versión LTS, y [Git](https://git-scm.com).

**En Windows**, instala Node.js y Git con sus instaladores, abre **PowerShell** y corre:

```powershell
git clone https://github.com/paidbyfacu/fchat.git
cd fchat
npm install
copy .env.example .env.local
notepad .env.local
```

En `.env.local`, completa `PGLITE_DIR` con una carpeta fuera del proyecto, por ejemplo `C:/fchat-data`, y guarda.

**En Mac**, instala Node.js con su instalador y Git con `xcode-select --install`. Abre **Terminal** y corre:

```bash
git clone https://github.com/paidbyfacu/fchat.git
cd fchat
npm install
cp .env.example .env.local
open -e .env.local
```

En `.env.local`, completa `PGLITE_DIR` con una carpeta fuera del proyecto, por ejemplo `/Users/tu-usuario/fchat-data`, y guarda.

Después, en los dos sistemas:

```bash
npm run dev     # panel en http://localhost:3000
npm test        # pruebas
```

Abre `http://localhost:3000` y aparece la misma pantalla de instalación. La base local se guarda en `PGLITE_DIR`.

Para que Meta llegue a tu computadora necesitas una dirección pública. Una opción es un túnel de Cloudflare: instala `cloudflared` con `winget install --id Cloudflare.cloudflared` en Windows o `brew install cloudflared` en Mac, corre `cloudflared tunnel --url http://localhost:3000` y pon la dirección que te da en `PUBLIC_URL`. Esa dirección cambia cada vez que lo arrancas: hay que actualizarla en `PUBLIC_URL` y en el webhook de Meta.

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
- Nunca compartas la clave secreta de tu app de Meta ni el token de Instagram. Si los mostraste por error, cambia la clave en Meta o crea una app nueva, y pégala otra vez en FChat.

Si encuentras una falla de seguridad, avísame por mensaje privado antes de publicarla.

## Buen uso

- La app cumple las reglas de Meta: una respuesta privada por comentario, dentro de los 7 días, y la ventana de 24 horas para seguir la conversación.
- Instagram castiga el spam, no la herramienta: varía los textos, no mandes mensajes a quien no interactuó y evita respuestas de solo emojis.
- Funciona para tus propias cuentas. Para manejar cuentas de otras personas, Meta pide revisar tu app con su proceso de App Review.

## Aviso

FChat es un proyecto independiente. No está afiliado ni respaldado por Meta, Instagram, TikTok ni ManyChat. Cada persona que lo instala es responsable de usarlo según las políticas de cada plataforma y las leyes de su país. FChat y paidbyfacu no se hacen responsables por bloqueos, suspensiones o baneos de cuentas, ni por el mal uso de la plataforma. Los términos completos se aceptan al instalar y están en `/terminos` de tu panel.

La página `/privacy` que trae cada instalación es un punto de partida: revísala y adáptala a tu caso.

Las capturas de esta guía son de una instalación de prueba con datos inventados.

## Licencia

[MIT con la condición Commons Clause](LICENSE). Puedes usarlo gratis, para tus cuentas y para tu negocio, cambiarlo y compartirlo. **No puedes venderlo ni comercializarlo**: ni cobrar por el software o por una copia modificada, ni ofrecerlo como un servicio pago, ni cobrar por instalarlo o alojarlo cuando lo que vendes es FChat. Los nombres y logos de FChat y paidbyfacu están reservados.

Si te sirvió, cuéntamelo en Instagram: [@paidbyfacu](https://instagram.com/paidbyfacu).
