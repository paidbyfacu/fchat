import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { WORKFLOW_PATH, WORKFLOW_YAML } from "./update-workflow"
import { isNewer } from "./version"

describe("update workflow", () => {
  it("the copy in the code matches the file", () => {
    const file = readFileSync(path.join(__dirname, "..", "..", WORKFLOW_PATH), "utf8").replace(/\r\n/g, "\n")
    expect(WORKFLOW_YAML).toBe(file)
  })
})

describe("isNewer", () => {
  it("compares versions number by number", () => {
    expect(isNewer("1.0.1", "1.0.0")).toBe(true)
    expect(isNewer("1.10.0", "1.9.3")).toBe(true)
    expect(isNewer("1.0.0", "1.0.0")).toBe(false)
    expect(isNewer("0.9.9", "1.0.0")).toBe(false)
    expect(isNewer(null, "1.0.0")).toBe(false)
  })
})
