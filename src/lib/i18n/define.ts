/**
 * One group of dashboard texts in both languages. TypeScript checks that the English
 * side has exactly the same keys as the Spanish side, so no text is missing.
 * Values are plain strings, so they can travel to Client Components.
 */
export function defineMessages<T extends Record<string, string>>(m: { es: T; en: { [K in keyof T]: string } }) {
  return m as { es: T; en: { [K in keyof T]: string } }
}
