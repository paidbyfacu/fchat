/**
 * Normalizes a keyword or a comment so they can be compared:
 * lowercase, no accents, no punctuation or emojis, single spaces.
 * It is the same function the engine uses when a comment arrives.
 */
export function normalizeKeyword(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Whole-word "contains": "link" matches "send me the link!" but not "linkedin". */
export function matchesKeyword(text: string, keyword: string): boolean {
  const t = ` ${normalizeKeyword(text)} `
  const k = normalizeKeyword(keyword)
  return k.length > 0 && t.includes(` ${k} `)
}
