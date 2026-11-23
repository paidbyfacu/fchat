import { Fragment, type ReactNode } from "react"

/**
 * Turns a translated text with simple tags into React elements, so bold words and
 * links can live inside one sentence: rich("Click <b>Save</b>", { b: (c) => <strong>{c}</strong> }).
 * Tags cannot be nested. A tag without a renderer is shown as plain text.
 */
export function rich(text: string, tags: Record<string, (children: string) => ReactNode>): ReactNode {
  const out: ReactNode[] = []
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g
  let last = 0
  let i = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const render = tags[m[1]]
    out.push(<Fragment key={i++}>{render ? render(m[2]) : m[2]}</Fragment>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out.length === 1 ? out[0] : <>{out}</>
}
