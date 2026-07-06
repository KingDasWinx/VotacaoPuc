import type { ProgramacaoItem } from '@/lib/types'
import { Coffee, Mic, Users, Flag, DoorOpen, CircleDot } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  palestra: 'Palestra',
  mesa_redonda: 'Mesa redonda',
  coffee_break: 'Coffee break',
  abertura: 'Abertura',
  encerramento: 'Encerramento',
  outro: 'Atividade',
}

const TIPO_ICON: Record<string, typeof Mic> = {
  palestra: Mic,
  mesa_redonda: Users,
  coffee_break: Coffee,
  abertura: Flag,
  encerramento: DoorOpen,
  outro: CircleDot,
}

const TIPO_COR: Record<string, string> = {
  palestra: 'bg-brand/10 text-brand border-brand/20',
  mesa_redonda: 'bg-accent-tint/40 text-accent-hover border-accent/30',
  coffee_break: 'bg-surface text-ink/70 border-line',
  abertura: 'bg-brand text-on-dark border-brand',
  encerramento: 'bg-brand text-on-dark border-brand',
  outro: 'bg-white text-ink/70 border-line',
}

function formatHora(h: string | null) {
  if (!h) return ''
  return h.slice(0, 5)
}

function formatDia(dia: string) {
  const d = new Date(dia + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function ProgramacaoTimeline({ itens }: { itens: ProgramacaoItem[] }) {
  if (itens.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line py-16 text-center text-ink/55">
        Programação em breve. Volte mais tarde!
      </p>
    )
  }

  const dias = Array.from(new Set(itens.map((i) => i.dia))).sort()

  return (
    <div className="space-y-10">
      {dias.map((dia) => {
        const doDia = itens.filter((i) => i.dia === dia)
        return (
          <section key={dia}>
            <h2 className="text-lg font-extrabold capitalize text-brand">{formatDia(dia)}</h2>
            <div className="relative mt-5 space-y-0">
              <div className="absolute bottom-2 left-[19px] top-2 w-px bg-line" aria-hidden />
              {doDia.map((item) => {
                const Icon = TIPO_ICON[item.tipo] ?? CircleDot
                const cor = TIPO_COR[item.tipo] ?? TIPO_COR.outro
                return (
                  <article key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${cor}`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:shadow-card-hover">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-brand">
                          {formatHora(item.hora_inicio)}
                          {item.hora_fim ? ` – ${formatHora(item.hora_fim)}` : ''}
                        </span>
                        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/55">
                          {TIPO_LABEL[item.tipo] ?? item.tipo}
                        </span>
                        {item.local_sala && (
                          <span className="text-xs text-ink/50">{item.local_sala}</span>
                        )}
                      </div>
                      <h3 className="mt-1 font-bold text-ink">{item.titulo}</h3>
                      {item.palestrante && (
                        <p className="mt-0.5 text-sm font-semibold text-brand-muted">{item.palestrante}</p>
                      )}
                      {item.descricao && (
                        <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.descricao}</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
