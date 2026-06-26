import Link from 'next/link'
import { formatBRL } from '@/lib/money'

export function TicketBox({
  disponivel, loteNome, precoCentavos, inscricoesAbertas,
}: {
  disponivel: boolean
  loteNome: string | null
  precoCentavos: number | null
  inscricoesAbertas: boolean
}) {
  const indisponivel = !inscricoesAbertas || !disponivel || precoCentavos == null
  return (
    <div className="animate-fade-up overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:shadow-card-hover">
      <div className="flex items-center justify-between border-b border-line bg-surface/60 px-6 py-4">
        <h2 className="text-lg font-extrabold text-brand">Ingresso</h2>
        <span className="rounded-full bg-accent-tint/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-hover">
          PIX
        </span>
      </div>

      <div className="p-6">
        {indisponivel ? (
          <p className="rounded-2xl bg-surface px-4 py-4 text-center text-sm font-semibold text-brand">
            {inscricoesAbertas ? 'Vendas indisponíveis no momento.' : 'Inscrições encerradas.'}
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">{loteNome}</p>
                <p className="mt-1 text-4xl font-extrabold text-brand">{formatBRL(precoCentavos!)}</p>
                <p className="mt-1 text-xs text-ink/50">por pessoa</p>
              </div>
            </div>
            <Link
              href="/inscricao"
              className="mt-6 block rounded-full bg-accent py-3.5 text-center font-bold uppercase tracking-wide text-brand shadow-card transition hover:-translate-y-0.5 hover:bg-accent-hover hover:text-on-dark hover:shadow-card-hover active:translate-y-0"
            >
              Comprar ingresso
            </Link>
          </>
        )}
        <Link
          href="/meus-ingressos"
          className="mt-4 block text-center text-sm font-semibold text-brand underline-offset-4 transition hover:text-brand-hover hover:underline"
        >
          Já se inscreveu? Ver meus ingressos
        </Link>
      </div>
    </div>
  )
}
