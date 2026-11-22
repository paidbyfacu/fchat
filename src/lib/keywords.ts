/**
 * Normaliza una palabra clave o un comentario para compararlos:
 * minúsculas, sin acentos, sin puntuación ni emojis, espacios simples.
 * Es la misma función que usa el motor al recibir un comentario.
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

/** "contains" por palabra completa: "link" coincide con "pasame el link!" pero no con "linkedin". */
export function matchesKeyword(text: string, keyword: string): boolean {
  const t = ` ${normalizeKeyword(text)} `
  const k = normalizeKeyword(keyword)
  return k.length > 0 && t.includes(` ${k} `)
}
