import { createHmac, randomBytes } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import { openDb, type Db } from "../db"
import { encrypt, verifyMetaSignature } from "../crypto"
import { IgError, type IgMessage, type IgRecipient, type InstagramClient } from "../instagram"
import { matchesKeyword } from "@/lib/keywords"
import { commentToDmGraph, payloadFor } from "./graph"
import { ingest, toIngestItems } from "./ingest"
import { processPending, resumeDueRuns, type EngineDeps } from "./engine"

const KEY = randomBytes(32).toString("base64")
const IG_ID = "17841400000000001"

type Sent = { recipient: IgRecipient; message: IgMessage }

function fakeInstagram(follows: () => boolean) {
  const sent: Sent[] = []
  const failures: Error[] = []
  const replies: { commentId: string; text: string }[] = []
  let n = 0
  const ig: InstagramClient = {
    async sendMessage(_t, _ig, recipient, message) {
      const f = failures.shift()
      if (f) throw f
      sent.push({ recipient, message })
      return { message_id: `m${++n}` }
    },
    async replyToComment(_t, commentId, text) {
      replies.push({ commentId, text })
      return { id: `r${replies.length}` }
    },
    async getProfile() {
      return { username: "alguien", is_user_follow_business: follows() }
    },
    async getMedia(_t, id) {
      return { id, timestamp: new Date().toISOString() }
    },
    async listMedia() {
      return { data: [] }
    },
    async getMe() {
      return { user_id: IG_ID, username: "micuenta" }
    },
    async subscribe() {},
    async refreshToken() {
      return { access_token: "nuevo", expires_in: 5_000_000 }
    },
  }
  return { ig, sent, failures, replies }
}

async function setup(db: Db, { status = "live", maxFollowAsks = 3, publicReplies = [] as string[] } = {}) {
  const [u] = await db.query<{ id: string }>(`insert into users (email, password_hash) values ('yo@x.com', 'x') returning id`)
  const [acc] = await db.query<{ id: string }>(
    `insert into ig_accounts (user_id, ig_user_id, username, access_token_enc, token_expires_at)
     values ($1, $2, 'micuenta', $3, now() + interval '50 days') returning id`,
    [u.id, IG_ID, encrypt("token-de-prueba", KEY)],
  )
  const graph = commentToDmGraph({
    opening: "¿Te paso el link?",
    openingButton: "Sí",
    followPrompt: "Seguime primero",
    followedButton: "Ya te sigo",
    linkText: "Acá está",
    links: [{ title: "Abrir", url: "https://example.com/guia" }],
    maxFollowAsks,
  })
  const [a] = await db.query<{ id: string }>(
    `insert into automations (ig_account_id, name, status) values ($1, 'Test', $2) returning id`,
    [acc.id, status],
  )
  const [v] = await db.query<{ id: string }>(`insert into automation_versions (automation_id, version, graph) values ($1, 1, $2) returning id`, [
    a.id,
    JSON.stringify(graph),
  ])
  await db.query(`update automations set live_version_id = $2 where id = $1`, [a.id, v.id])
  await db.query(
    `insert into triggers (automation_id, ig_account_id, type, post_scope, keywords_include, keywords_exclude, match, is_active, public_replies)
     values ($1, $2, 'comment', 'any', '{link}', '{precio}', 'contains', true, $3)`,
    [a.id, acc.id, publicReplies],
  )
  return { accountId: acc.id, automationId: a.id }
}

const commentHook = (id: string, text: string, from = "u1", media = "media1") => ({
  object: "instagram",
  entry: [{ id: IG_ID, time: 1, changes: [{ field: "comments", value: { id, text, from: { id: from, username: "alguien" }, media: { id: media } } }] }],
})

const tapHook = (from: string, payload: string, mid: string) => ({
  object: "instagram",
  entry: [{ id: IG_ID, time: 1, messaging: [{ sender: { id: from }, recipient: { id: IG_ID }, timestamp: 1, postback: { mid, payload, title: "x" } }] }],
})

const textOf = (m: IgMessage) => ("attachment" in m ? m.attachment.payload.text : m.text)

function postbackPayload(m: IgMessage, index = 0): string {
  if (!("attachment" in m)) throw new Error("no es un template")
  const b = m.attachment.payload.buttons.filter((x) => x.type === "postback")[index]
  if (!b || b.type !== "postback") throw new Error("sin postback")
  return b.payload
}

describe("engine", () => {
  let db: Db
  let follows: boolean
  let ig: ReturnType<typeof fakeInstagram>
  let deps: EngineDeps

  beforeEach(async () => {
    db = await openDb({ pgliteDir: "memory://", url: "" })
    follows = true
    ig = fakeInstagram(() => follows)
    deps = { db, ig: ig.ig, encKey: KEY }
  })

  async function hook(body: unknown) {
    await ingest(db, toIngestItems(body))
    await processPending(deps)
  }

  it("comment with the keyword → private reply with a button", async () => {
    await setup(db)
    await hook(commentHook("c1", "Quiero el LINK!"))
    expect(ig.sent).toHaveLength(1)
    expect(ig.sent[0].recipient).toEqual({ comment_id: "c1" })
    expect(textOf(ig.sent[0].message)).toBe("¿Te paso el link?")
    const [ce] = await db.query(`select status, private_reply_mid from comment_events`)
    expect(ce).toMatchObject({ status: "replied", private_reply_mid: "m1" })
    const [run] = await db.query(`select status, current_node, waiting_for from flow_runs`)
    expect(run).toMatchObject({ status: "waiting", current_node: "open", waiting_for: "button" })
  })

  it("public reply: answers under the comment with one of the variants, only once", async () => {
    const variantes = ["¡Te escribí por privado!", "Revisa tus mensajes", "Te mandé todo por DM"]
    await setup(db, { publicReplies: variantes })
    await hook(commentHook("c1", "link"))
    await hook(commentHook("c1", "link"))
    expect(ig.replies).toHaveLength(1)
    expect(ig.replies[0].commentId).toBe("c1")
    expect(variantes).toContain(ig.replies[0].text)
    const [ce] = await db.query(`select public_reply_id from comment_events`)
    expect(ce).toMatchObject({ public_reply_id: "r1" })
  })

  it("with no variants it does not reply publicly", async () => {
    await setup(db)
    await hook(commentHook("c1", "link"))
    expect(ig.replies).toHaveLength(0)
  })

  it("the same webhook twice → a single DM", async () => {
    await setup(db)
    await hook(commentHook("c1", "link"))
    await hook(commentHook("c1", "link"))
    expect(ig.sent).toHaveLength(1)
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int n from webhook_events`)
    expect(n).toBe(1)
  })

  it("taps the button and follows → gets the link and finishes", async () => {
    await setup(db)
    await hook(commentHook("c1", "link"))
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    expect(ig.sent).toHaveLength(2)
    expect(ig.sent[1].recipient).toEqual({ id: "u1" })
    const m = ig.sent[1].message
    expect("attachment" in m && m.attachment.payload.buttons[0]).toMatchObject({ type: "web_url", url: "https://example.com/guia" })
    const [run] = await db.query(`select status from flow_runs`)
    expect(run.status).toBe("done")
    const [c] = await db.query(`select opted_in, follows_business from contacts`)
    expect(c).toMatchObject({ opted_in: true, follows_business: true })
    const steps = (await db.query<{ step: string }>(`select step from automation_events order by id`)).map((r) => r.step)
    expect(steps).toEqual(["triggered", "dm_sent", "opened", "followed", "link_sent"])
  })

  it("does not follow → asks to follow; Following checks again; on the third try sends the link anyway", async () => {
    await setup(db)
    follows = false
    await hook(commentHook("c1", "link"))
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    expect(textOf(ig.sent[1].message)).toBe("Seguime primero")
    // the profile button points to the account
    const ask = ig.sent[1].message
    expect("attachment" in ask && ask.attachment.payload.buttons[0]).toMatchObject({ type: "web_url", url: "https://www.instagram.com/micuenta" })
    await hook(tapHook("u1", postbackPayload(ig.sent[1].message), "t2"))
    await hook(tapHook("u1", postbackPayload(ig.sent[2].message), "t3"))
    await hook(tapHook("u1", postbackPayload(ig.sent[3].message), "t4"))
    expect(ig.sent.map((s) => textOf(s.message))).toEqual([
      "¿Te paso el link?",
      "Seguime primero",
      "Seguime primero",
      "Seguime primero",
      "Acá está",
    ])
    const [run] = await db.query(`select status from flow_runs`)
    expect(run.status).toBe("done")
  })

  it("until they follow: without following they never get the link; once they follow, they do", async () => {
    await setup(db, { maxFollowAsks: 0 })
    follows = false
    await hook(commentHook("c1", "link"))
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    for (let i = 1; i <= 6; i++) await hook(tapHook("u1", postbackPayload(ig.sent[i].message), `t${i + 1}`))
    expect(ig.sent.map((s) => textOf(s.message)).filter((t) => t === "Acá está")).toHaveLength(0)
    expect(ig.sent).toHaveLength(8)
    const [waiting] = await db.query(`select status, current_node from flow_runs`)
    expect(waiting).toMatchObject({ status: "waiting", current_node: "ask" })
    follows = true
    await hook(tapHook("u1", postbackPayload(ig.sent[7].message), "t9"))
    expect(textOf(ig.sent[8].message)).toBe("Acá está")
    const [run] = await db.query(`select status from flow_runs`)
    expect(run.status).toBe("done")
  })

  it("Meta limit when sending → retries later and does not lose the person", async () => {
    await setup(db)
    let clock = new Date()
    deps.now = () => clock
    ig.failures.push(new IgError("Calls to this api have exceeded the rate limit.", 400, 613))
    await hook(commentHook("c1", "link"))
    expect(ig.sent).toHaveLength(0)
    const [r1] = await db.query(`select status, waiting_for, attempts from flow_runs`)
    expect(r1).toMatchObject({ status: "waiting", waiting_for: "time", attempts: 1 })
    const [ce1] = await db.query(`select status from comment_events`)
    expect(ce1.status).toBe("matched")
    // before the time, it does nothing
    expect(await resumeDueRuns(deps)).toBe(0)
    clock = new Date(clock.getTime() + 2 * 60_000)
    expect(await resumeDueRuns(deps)).toBe(1)
    expect(ig.sent).toHaveLength(1)
    expect(textOf(ig.sent[0].message)).toBe("¿Te paso el link?")
    const [r2] = await db.query(`select status, current_node, waiting_for, attempts from flow_runs`)
    expect(r2).toMatchObject({ status: "waiting", current_node: "open", waiting_for: "button", attempts: 0 })
    const [ce2] = await db.query(`select status, public_reply_id from comment_events`)
    expect(ce2).toMatchObject({ status: "replied" })
    // and the rest of the flow continues normally
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    expect(textOf(ig.sent[1].message)).toBe("Acá está")
  })

  it("an error that waiting will not fix → the run fails without retrying", async () => {
    await setup(db)
    ig.failures.push(new IgError("Invalid OAuth access token", 400, 190))
    await hook(commentHook("c1", "link"))
    const [run] = await db.query(`select status from flow_runs`)
    expect(run.status).toBe("failed")
    const [acc] = await db.query(`select status from ig_accounts`)
    expect(acc.status).toBe("expired")
  })

  it("multipost: the keyword works on any of the chosen posts and no others", async () => {
    await setup(db)
    await db.query(`update triggers set post_scope = 'specific', media_ids = '{reelA,reelB}'`)
    await hook(commentHook("c1", "link", "u1", "reelB"))
    await hook(commentHook("c2", "link", "u2", "reelA"))
    await hook(commentHook("c3", "link", "u3", "otroPost"))
    expect(ig.sent.map((s) => s.recipient)).toEqual([{ comment_id: "c1" }, { comment_id: "c2" }])
  })

  it("any post: the same person gets a DM for each different post they comment on", async () => {
    await setup(db)
    await hook(commentHook("c1", "link", "u1", "post1"))
    await hook(commentHook("c2", "Link", "u1", "post2"))
    await hook(commentHook("c3", "LINK", "u1", "post2"))
    expect(ig.sent.map((s) => s.recipient)).toEqual([{ comment_id: "c1" }, { comment_id: "c2" }])
  })

  it("if they start following on the second try, they get the link", async () => {
    await setup(db)
    follows = false
    await hook(commentHook("c1", "link"))
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    follows = true
    await hook(tapHook("u1", postbackPayload(ig.sent[1].message), "t2"))
    expect(ig.sent.map((s) => textOf(s.message))).toEqual(["¿Te paso el link?", "Seguime primero", "Acá está"])
  })

  it("ignores own comments, comments without the keyword or with a blocking word", async () => {
    await setup(db)
    await hook(commentHook("c1", "link", IG_ID))
    await hook(commentHook("c2", "me encantó"))
    await hook(commentHook("c3", "link y precio?"))
    await hook(commentHook("c4", "linkedin"))
    expect(ig.sent).toHaveLength(0)
  })

  it("the same person comments twice on the same post → a single DM", async () => {
    await setup(db)
    await hook(commentHook("c1", "link"))
    await hook(commentHook("c2", "link otra vez"))
    expect(ig.sent).toHaveLength(1)
    const statuses = (await db.query<{ status: string }>(`select status from comment_events order by created_at`)).map((r) => r.status)
    expect(statuses).toEqual(["replied", "ignored"])
  })

  it("a tap from someone else or a repeated tap does not advance the run", async () => {
    await setup(db)
    await hook(commentHook("c1", "link"))
    const payload = postbackPayload(ig.sent[0].message)
    await hook(tapHook("otra", payload, "t1"))
    expect(ig.sent).toHaveLength(1)
    await hook(tapHook("u1", payload, "t2"))
    await hook(tapHook("u1", payload, "t3")) // repeated: the run already moved on
    expect(ig.sent).toHaveLength(2)
  })

  it("draft automation → does not reply", async () => {
    await setup(db, { status: "draft" })
    await hook(commentHook("c1", "link"))
    expect(ig.sent).toHaveLength(0)
  })

  it("24 h window closed → does not send and the run expires", async () => {
    await setup(db)
    follows = false
    await hook(commentHook("c1", "link"))
    deps.now = () => new Date(Date.now() + 25 * 3600_000)
    await hook(tapHook("u1", postbackPayload(ig.sent[0].message), "t1"))
    expect(ig.sent).toHaveLength(1)
    const [run] = await db.query(`select status, error from flow_runs`)
    expect(run.status).toBe("expired")
  })

  it("a payload with an unexpected shape breaks nothing", async () => {
    await setup(db)
    await hook(tapHook("u1", "cualquier-cosa", "t1"))
    await hook(tapHook("u1", payloadFor("00000000-0000-0000-0000-000000000000", "yes"), "t2"))
    expect(ig.sent).toHaveLength(0)
    const [{ failed }] = await db.query<{ failed: number }>(`select count(*)::int failed from webhook_events where status = 'failed'`)
    expect(failed).toBe(0)
  })
})

describe("Meta signature", () => {
  it("accepts the right signature and rejects the rest", () => {
    const body = '{"object":"instagram"}'
    const sig = "sha256=" + createHmac("sha256", "secreto").update(body).digest("hex")
    expect(verifyMetaSignature(body, sig, "secreto")).toBe(true)
    expect(verifyMetaSignature(body + " ", sig, "secreto")).toBe(false)
    expect(verifyMetaSignature(body, sig, "otro")).toBe(false)
    expect(verifyMetaSignature(body, null, "secreto")).toBe(false)
  })
})

describe("keywords", () => {
  it("normalizes case, accents and punctuation, and matches whole words", () => {
    expect(matchesKeyword("Pasame el LINK!!", "link")).toBe(true)
    expect(matchesKeyword("quiero info 🙏", "INFO")).toBe(true)
    expect(matchesKeyword("Guía", "guia")).toBe(true)
    expect(matchesKeyword("linkedin", "link")).toBe(false)
    expect(matchesKeyword("precio del curso", "precio del curso")).toBe(true)
  })
})
