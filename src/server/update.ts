// Versions and automatic updates. Each installation compares its version with the
// official repository's. If it has the update workflow, GitHub updates it every
// 4 hours and Vercel deploys the change.

import { cacheLife } from "next/cache"
import pkg from "../../package.json"
import { isNewer } from "@/lib/version"
import { WORKFLOW_PATH, WORKFLOW_YAML } from "@/lib/update-workflow"

export const APP_VERSION: string = pkg.version
export const UPSTREAM_REPO = "paidbyfacu/fchat"

/** Version published in the official repository, or null if GitHub does not respond. Checked at most once an hour. */
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
  /** Whether this installation's repository has the workflow, as of the last deploy. */
  autoUpdate: boolean
  /** This installation's GitHub repository, if it runs on Vercel. */
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
    // the account that publishes FChat: its repositories are the source of versions and are not updated from outside
    isUpstream: !!repo && repo.owner.toLowerCase() === UPSTREAM_REPO.split("/")[0],
    onVercel: !!process.env.VERCEL,
  }
}

/** GitHub link that opens the workflow file already written: only "Commit changes" is left. */
export function createWorkflowUrl(repo: NonNullable<UpdateInfo["repo"]>): string {
  const q = new URLSearchParams({ filename: WORKFLOW_PATH, value: WORKFLOW_YAML })
  return `https://github.com/${repo.owner}/${repo.slug}/new/${encodeURIComponent(repo.branch)}?${q}`
}

/** The workflow page on GitHub, with the "Run workflow" button to update right away. */
export function runWorkflowUrl(repo: NonNullable<UpdateInfo["repo"]>): string {
  return `https://github.com/${repo.owner}/${repo.slug}/actions/workflows/actualizar-fchat.yml`
}
