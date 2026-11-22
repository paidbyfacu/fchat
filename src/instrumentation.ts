// Se ejecuta una vez al arrancar el servidor: migraciones, usuario dueño y worker.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.WORKER === "off") return
  const { startWorker } = await import("./server/worker")
  try {
    await startWorker()
  } catch (e) {
    // en producción no tiene sentido arrancar sin worker: que el hosting lo reinicie
    if (process.env.NODE_ENV === "production") throw e
    console.error("[worker] no arrancó:", e)
  }
}
