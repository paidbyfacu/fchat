// Runs once when the server starts: migrations, owner user and worker.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.WORKER === "off") return
  const { startWorker } = await import("./server/worker")
  try {
    await startWorker()
  } catch (e) {
    // in production there is no point running without a worker: let the host restart it
    if (process.env.NODE_ENV === "production") throw e
    console.error("[worker] did not start:", e)
  }
}
