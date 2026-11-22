// Versiones y actualizaciones automáticas. Cada instalación compara su versión con
// la del repositorio oficial. Si tiene el workflow de actualización, GitHub la
// actualiza solo cada 4 horas y Vercel publica el cambio.

import { cacheLife } from "next/cache"
import pkg from "../../package.json"
import { isNewer } from "@/lib/version"
import { WORKFLOW_PATH, WORKFLOW_YAML } from "@/lib/update-workflow"

export const APP_VERSION: string = pkg.version
export const UPSTREAM_REPO = "paidbyfacu/fchat"

/** Versión publicada en el repositorio oficial, o null si GitHub no responde. Se consulta como mucho una vez por hora. */
export async function latestVersion(): Promise<string | null> {
  "use cache"
  cacheLife("hours")
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${UPSTREAM_REPO}/main/package.json`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return null
    const j = (await r.json()) as { version?: unknown }
    return typeof j.version === "string" ? j.version : null
  } catch {
    return null
  }
}

export type UpdateInfo = {
  current: string
  latest: string | null
  outdated: boolean
  /** Si el repositorio de esta instalación tiene el workflow, según el último deploy. */
  autoUpdate: boolean
  /** Repositorio de GitHub de esta instalación, si corre en Vercel. */
  repo: { owner: string; slug: string; branch: string } | null
  isUpstream: boolean
  onVercel: boolean
}

export async function updateInfo(): Promise<UpdateInfo> {
  const latest = await latestVersion()
  const owner = process.env.VERCEL_GIT_REPO_OWNER
  const slug = process.env.VERCEL_GIT_REPO_SLUG
  const repo = owner && slug ? { owner, slug, branch: process.env.VERCEL_GIT_COMMIT_REF || "main" } : null
  return {
    current: APP_VERSION,
    latest,
    outdated: isNewer(latest, APP_VERSION),
    autoUpdate: process.env.FCHAT_AUTOUPDATE === "1",
    repo,
    // la cuenta que publica FChat: sus repositorios son el origen de las versiones, no se actualizan desde afuera
    isUpstream: !!repo && repo.owner.toLowerCase() === UPSTREAM_REPO.split("/")[0],
    onVercel: !!process.env.VERCEL,
  }
}

/** Link de GitHub que abre el archivo del workflow ya escrito: solo falta tocar «Commit changes». */
export function createWorkflowUrl(repo: NonNullable<UpdateInfo["repo"]>): string {
  const q = new URLSearchParams({ filename: WORKFLOW_PATH, value: WORKFLOW_YAML })
  return `https://github.com/${repo.owner}/${repo.slug}/new/${encodeURIComponent(repo.branch)}?${q}`
}

/** Página del workflow en GitHub, con el botón «Run workflow» para actualizar en el momento. */
export function runWorkflowUrl(repo: NonNullable<UpdateInfo["repo"]>): string {
  return `https://github.com/${repo.owner}/${repo.slug}/actions/workflows/actualizar-fchat.yml`
}
