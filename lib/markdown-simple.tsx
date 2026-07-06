import type { ReactNode } from 'react'

/** ponytail: parser mínimo de markdown — só o que o regulamento usa; upgrade: react-markdown */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('***') && part.endsWith('***')) {
      return (
        <strong key={i}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

export function renderSimpleMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const nodes: ReactNode[] = []
  let listItems: string[] = []
  let key = 0
  const normalize = (s: string) =>
    s
      .replace(/\u00A0/g, ' ')
      .replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1')

  function flushList() {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={key++} className="mt-2 list-none space-y-2">
        {listItems.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      listItems.push(normalize(trimmed.slice(2)))
      continue
    }
    flushList()

    if (trimmed === '---') {
      nodes.push(<hr key={key++} className="my-6 border-line" />)
      continue
    }
    if (trimmed.startsWith('#### ')) {
      nodes.push(
        <h4 key={key++} className="mt-5 text-sm font-bold text-brand">
          {inline(normalize(trimmed.slice(5)))}
        </h4>
      )
      continue
    }
    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3 key={key++} className="mt-6 text-base font-bold text-brand">
          {inline(normalize(trimmed.slice(4)))}
        </h3>
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h2 key={key++} className="mt-8 text-lg font-bold text-brand">
          {inline(normalize(trimmed.slice(3)))}
        </h2>
      )
      continue
    }
    if (trimmed.startsWith('# ')) {
      nodes.push(
        <h1 key={key++} className="text-2xl font-extrabold text-brand">
          {inline(normalize(trimmed.slice(2)))}
        </h1>
      )
      continue
    }
    if (!trimmed) continue

    nodes.push(
      <p key={key++} className="mt-3 text-sm leading-relaxed text-ink/75">
        {inline(normalize(trimmed))}
      </p>
    )
  }
  flushList()
  return nodes
}
