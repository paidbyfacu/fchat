import { beforeEach, describe, expect, it } from "vitest"
import { openDb, type Db } from "./db"
import { clearAttempts, GLOBAL_PER_HOUR, PER_IP, startAttempt } from "./login-guard"
import { safeNext } from "@/lib/safe-next"
import { deviceLabel } from "@/lib/device"
import { safeEqual, sign, verify } from "./crypto"

let db: Db

describe("login brake", () => {
  beforeEach(async () => {
    db = await openDb({ pgliteDir: "memory://", url: "" })
  })

  it("allows 5 attempts per IP and blocks the sixth", async () => {
    for (let i = 0; i < PER_IP; i++) expect((await startAttempt(db, "1.1.1.1", "a@b.c")).blocked).toBe(false)
    expect((await startAttempt(db, "1.1.1.1", "a@b.c")).blocked).toBe(true)
    // another IP can still try
    expect((await startAttempt(db, "2.2.2.2", "a@b.c")).blocked).toBe(false)
  })

  it("a successful login clears that IP's attempts", async () => {
    for (let i = 0; i < PER_IP; i++) await startAttempt(db, "1.1.1.1", "a@b.c")
    await clearAttempts(db, "1.1.1.1")
    expect((await startAttempt(db, "1.1.1.1", "a@b.c")).blocked).toBe(false)
  })

  it("a single insisting IP does not close the login for the others", async () => {
    for (let i = 0; i < GLOBAL_PER_HOUR + 10; i++) await startAttempt(db, "6.6.6.6", "a@b.c")
    expect((await startAttempt(db, "3.3.3.3", "a@b.c")).blocked).toBe(false)
  })

  it("many IPs at once close the login for an hour", async () => {
    for (let i = 0; i < GLOBAL_PER_HOUR; i++) await startAttempt(db, `10.0.0.${i}`, "a@b.c")
    expect((await startAttempt(db, "4.4.4.4", "a@b.c")).blocked).toBe(true)
  })

  it("parallel attempts see each other", async () => {
    const r = await Promise.all(Array.from({ length: 12 }, () => startAttempt(db, "5.5.5.5", "a@b.c")))
    expect(r.filter((a) => !a.blocked).length).toBeLessThanOrEqual(PER_IP)
  })
})

describe("going back after logging in", () => {
  it("accepts internal paths", () => {
    expect(safeNext("/automations")).toBe("/automations")
    expect(safeNext("/automations/123/edit?x=1")).toBe("/automations/123/edit?x=1")
  })
  it("rejects jumps to other sites", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\t/evil.com", "https://evil.com", "evil.com", "/a\\b", ""]) {
      expect(safeNext(bad)).toBe("/")
    }
  })
})

describe("signatures and secrets", () => {
  it("compares secrets", () => {
    expect(safeEqual("Bearer abc", "Bearer abc")).toBe(true)
    expect(safeEqual("Bearer abd", "Bearer abc")).toBe(false)
    expect(safeEqual(null, "x")).toBe(false)
    expect(safeEqual("", "")).toBe(false)
  })
  it("a token signed with another secret or expired is not valid", () => {
    const t = sign({ typ: "s", exp: Date.now() + 60_000 }, "secreto")
    expect(verify(t, "secreto")).toBeTruthy()
    expect(verify(t, "otro")).toBeNull()
    expect(verify(sign({ exp: Date.now() - 1 }, "secreto"), "secreto")).toBeNull()
    const [body] = t.split(".")
    expect(verify(`${body}.AAAA`, "secreto")).toBeNull()
  })
})

describe("device name", () => {
  it("recognizes the common ones", () => {
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36", "es")).toBe("Chrome en Windows")
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", "es")).toBe(
      "Safari en iPhone",
    )
    expect(deviceLabel(null, "es")).toBe("Dispositivo desconocido")
    expect(deviceLabel(null, "en")).toBe("Unknown device")
  })
})
