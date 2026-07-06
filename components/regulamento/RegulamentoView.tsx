import { getRegulamentoMarkdown } from '@/lib/regulamento'
import { renderSimpleMarkdown } from '@/lib/markdown-simple'
import { ScrollText } from 'lucide-react'

export function RegulamentoView({ compact }: { compact?: boolean }) {
  const md = getRegulamentoMarkdown()
  const content = renderSimpleMarkdown(md)

  if (compact) {
    return <div className="prose-regulamento space-y-1">{content}</div>
  }

  return (
    <>
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Informações</p>
        <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-brand">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <ScrollText size={20} />
          </span>
          Regulamento
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Regras Gerais do I Simpósio de Audiologia e Otoneurologia do Oeste do Paraná.
        </p>
      </div>
      <div
        className="animate-fade-up mt-8 rounded-2xl border border-line bg-white p-6 shadow-card"
        style={{ animationDelay: '80ms' }}
      >
        {content}
      </div>
    </>
  )
}
