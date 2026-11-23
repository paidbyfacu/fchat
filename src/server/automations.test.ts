import { randomBytes } from "node:crypto"
import { beforeEach, describe, expect, it } from "vitest"
import { openDb, type Db } from "./db"
import { encrypt } from "./crypto"
import type { IgMessage, InstagramClient } from "./instagram"
import { defaultWizard, validateWizard, type Wizard } from "@/lib/wizard"
import { deleteAutomation, loadWizard, saveAutomation } from "./automations"
import { compileWizard, wizardFromGraph } from "./engine/compile"
import { commentToDmGraph } from "./engine/graph"
import { ingest, toIngestItems } from "./engine/ingest"
import { processPending, type EngineDeps } from "./engine/engine"

const KEY = randomBytes(32).toString("base64")
const IG_ID = "17841400000000009"

function fakeIg() {
  const sent: IgMessage[] = []
  const publicReplies: { commentId: string; text: string }[] = []
  const ig: InstagramClient = {
    async sendMessage(_t, _i, _r, message) {
      sent.push(message)
      return { message_id: `m${sent.length}` }
    },
    async replyToComment(_t, commentId, text) {
      publicReplies.push({ commentId, text })
      return { id: `r${publicReplies.length}` }
    },
    async getProfile() {
      return { is_user_follow_business: true }
    },
    async getMedia(_t, id) {
      return { id, timestamp: new Date(Date.now() + 60_000).toISOString() }
    },
    async listMedia() {
      return { data: [] }
    },
    async getMe() {
      return { user_id: IG_ID, username: "cuenta" }
    },
    async subscribe() {},
    async refreshToken() {
      return { access_token: "x", expires_in: 1 }
    },
  }
  return { ig, sent, publicReplies }
}

const textOf = (m: IgMessage) => ("attachment" in m ? m.attachment.payload.text : m.text)
const payloadOf = (m: IgMessage) => {
  if (!("attachment" in m)) throw new Error("sin template")
  const b = m.attachment.payload.buttons.find((x) => x.type === "postback")
  if (!b || b.type !== "postback") throw new Error("sin postback")
  return b.payload
}

const comment = (id: string, text: string, media: string, from = "u1") => ({
  object: "instagram",
  entry: [{ id: IG_ID, changes: [{ field: "comments", value: { id, text, from: { id: from }, media: { id: media } } }] }],
})
const tap = (from: string, payload: string, mid: string) => ({
  object: "instagram",
  entry: [{ id: IG_ID, messaging: [{ sender: { id: from }, postback: { mid, payload } }] }],
})

function wizard(accountId: string, patch: Partial<Wizard> = {}): Wizard {
  return {
    ...defaultWizard(accountId),
    name: "Guía",
    scope: "specific",
    posts: [{ id: "p1" }, { id: "p2" }],
    include: ["Guía"],
    link: { text: "Acá está", links: [{ title: "Abrir", url: "https://example.com/guia" }] },
    ...patch,
  }
}

describe("wizard → automation", () => {
  let db: Db
  let userId: string
  let accountId: string
  let f: ReturnType<typeof fakeIg>
  let deps: EngineDeps

  beforeEach(async () => {
    db = await openDb({ pgliteDir: "memory://", url: "" })
    const [u] = await db.query<{ id: string }>(`insert into users (email, password_hash) values ('a@b.c', 'x') returning id`)
    userId = u.id
    const [a] = await db.query<{ id: string }>(
      `insert into ig_accounts (user_id, ig_user_id, username, access_token_enc, token_expires_at)
       values ($1, $2, 'cuenta', $3, now() + interval '50 days') returning id`,
      [userId, IG_ID, encrypt("t", KEY)],
    )
    accountId = a.id
    f = fakeIg()
    deps = { db, ig: f.ig, encKey: KEY }
  })

  const hook = async (body: unknown) => {
    await ingest(db, toIngestItems(body))
    await processPending(deps)
  }

  it("without ask to follow, the button goes straight to the link", () => {
    const { graph } = compileWizard(wizard("x", { askFollow: { ...defaultWizard("x").askFollow, on: false } }))
    expect(graph.nodes.map((n) => n.id)).toEqual(["open", "link"])
    const open = graph.nodes[0]
    expect(open.type === "send_message" && open.buttons?.[0]).toMatchObject({ type: "postback", next: "link" })
  })

  it("normalizes and deduplicates keywords and posts", () => {
    const { trigger } = compileWizard(wizard("x", { include: ["Guía", "guia", " GUÍA!"], posts: [{ id: "p1" }, { id: "p1" }] }))
    expect(trigger.keywords_include).toEqual(["guia"])
    expect(trigger.media_ids).toEqual(["p1"])
  })

  it("validation: does not publish without posts, with a half-written URL or with emoji-only replies", () => {
    const w = wizard("x", {
      posts: [],
      link: { text: "x", links: [{ title: "Abrir", url: "https://" }] },
      publicReplies: { on: true, texts: ["🙌🙌"] },
    })
    const fields = validateWizard(w).map((i) => i.field)
    expect(fields).toEqual(expect.arrayContaining(["posts", "link", "publicReplies"]))
  })

  it("a draft is saved incomplete; publishing requires everything", async () => {
    const draft = await saveAutomation(db, userId, null, wizard(accountId, { posts: [] }), false)
    expect(draft.ok).toBe(true)
    const pub = await saveAutomation(db, userId, draft.ok ? draft.id : null, wizard(accountId, { posts: [] }), true)
    expect(pub.ok).toBe(false)
    const [a] = await db.query(`select status, live_version_id from automations`)
    expect(a).toMatchObject({ status: "draft", live_version_id: null })
  })

  it("several posts: replies on the chosen ones and no others", async () => {
    const r = await saveAutomation(db, userId, null, wizard(accountId), true)
    expect(r.ok).toBe(true)
    await hook(comment("c1", "pasame la guía", "p2"))
    await hook(comment("c2", "pasame la guía", "otro-post", "u2"))
    expect(f.sent).toHaveLength(1)
    expect(textOf(f.sent[0])).toBe(defaultWizard("x").opening.text)
  })

  it("public reply: one of the variants, under the comment", async () => {
    const w = wizard(accountId, { publicReplies: { on: true, texts: ["Te escribí 💌", "Revisá tus DMs"] } })
    await saveAutomation(db, userId, null, w, true)
    await hook(comment("c1", "guia", "p1"))
    expect(f.publicReplies).toHaveLength(1)
    expect(f.publicReplies[0].commentId).toBe("c1")
    expect(["Te escribí 💌", "Revisá tus DMs"]).toContain(f.publicReplies[0].text)
    const [ce] = await db.query(`select public_reply_id from comment_events`)
    expect(ce.public_reply_id).toBe("r1")
  })

  it("edit and republish: a new version; a run in progress finishes with the previous one", async () => {
    const first = await saveAutomation(db, userId, null, wizard(accountId, { askFollow: { ...defaultWizard("x").askFollow, on: false } }), true)
    if (!first.ok) throw new Error("did not publish")
    await hook(comment("c1", "guia", "p1"))
    await saveAutomation(
      db,
      userId,
      first.id,
      wizard(accountId, { link: { text: "Texto nuevo", links: [{ title: "Nuevo", url: "https://example.com/nuevo" }] } }),
      true,
    )
    const versions = await db.query<{ version: number }>(`select version from automation_versions order by version`)
    expect(versions.map((v) => v.version)).toEqual([1, 2])
    await hook(tap("u1", payloadOf(f.sent[0]), "t1"))
    expect(textOf(f.sent[1])).toBe("Acá está") // version 1
    await hook(comment("c9", "guia", "p2", "u3"))
    await hook(tap("u3", payloadOf(f.sent[2]), "t2"))
    // the new person goes through version 2, with ask to follow on by default, and since they follow, they get the new link
    expect(textOf(f.sent[f.sent.length - 1])).toBe("Texto nuevo")
  })

  it("only one next-post automation can wait per account", async () => {
    const a = await saveAutomation(db, userId, null, wizard(accountId, { scope: "next", posts: [] }), true)
    expect(a.ok).toBe(true)
    const b = await saveAutomation(db, userId, null, wizard(accountId, { name: "Otra", scope: "next", posts: [] }), true)
    expect(b.ok).toBe(false)
    expect(!b.ok && b.issues[0].field).toBe("posts")
  })

  it("next post: assigned with the first comment on a new post", async () => {
    await saveAutomation(db, userId, null, wizard(accountId, { scope: "next", posts: [] }), true)
    await hook(comment("c1", "guia", "nuevo"))
    expect(f.sent).toHaveLength(1)
    const [t] = await db.query(`select media_id from triggers`)
    expect(t.media_id).toBe("nuevo")
    await hook(comment("c2", "guia", "otro", "u2"))
    expect(f.sent).toHaveLength(1)
  })

  it("warns if another active automation uses the same keyword on the same posts", async () => {
    await saveAutomation(db, userId, null, wizard(accountId, { name: "Primera" }), true)
    const r = await saveAutomation(db, userId, null, wizard(accountId, { name: "Segunda", posts: [{ id: "p2" }, { id: "p9" }] }), true)
    expect(r.ok && r.warnings[0]).toContain("Primera")
    const r2 = await saveAutomation(db, userId, null, wizard(accountId, { name: "Tercera", posts: [{ id: "p7" }] }), true)
    expect(r2.ok && r2.warnings).toEqual([])
  })

  it("does not allow touching another user's automations and deletes your own", async () => {
    const r = await saveAutomation(db, userId, null, wizard(accountId), true)
    if (!r.ok) throw new Error("did not publish")
    const [intruso] = await db.query<{ id: string }>(`insert into users (email, password_hash) values ('x@y.z', 'x') returning id`)
    expect(await deleteAutomation(db, intruso.id, r.id)).toBe(false)
    expect(await loadWizard(db, intruso.id, r.id)).toBeNull()
    expect(await deleteAutomation(db, userId, r.id)).toBe(true)
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int n from automations`)
    expect(n).toBe(0)
  })

  it("opens the automation seeded in milestone 1 in the wizard", () => {
    const g = commentToDmGraph({
      opening: "Hola",
      openingButton: "Sí",
      followPrompt: "Seguime",
      followedButton: "Listo",
      linkText: "Link",
      links: [{ title: "Abrir", url: "https://example.com" }],
    })
    const w = wizardFromGraph({ name: "Vieja", accountId: "a" }, g, {
      post_scope: "any",
      media_ids: [],
      keywords_include: ["prueba"],
      keywords_exclude: [],
      public_replies: [],
    })
    expect(w).toMatchObject({
      name: "Vieja",
      scope: "any",
      match: "words",
      include: ["prueba"],
      opening: { text: "Hola", button: "Sí" },
      askFollow: { on: true, text: "Seguime", button: "Listo", maxAsks: 3 },
      link: { text: "Link", links: [{ title: "Abrir", url: "https://example.com" }] },
      publicReplies: { on: false },
    })
    expect(validateWizard(w)).toEqual([])
  })
})
