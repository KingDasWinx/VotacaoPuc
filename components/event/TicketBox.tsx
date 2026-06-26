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
    <div className="rounded-2xl border border-simp-mist bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-simp-deep">Ingresso</h2>
      {indisponivel ? (
        <p className="mt-4 rounded-lg bg-simp-mist px-4 py-3 text-sm font-semibold text-simp-deep">
          {inscricoesAbertas ? 'Vendas indisponíveis no momento.' : 'Inscrições encerradas.'}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-simp-teal">{loteNome}</p>
              <p className="text-3xl font-extrabold text-simp-deep">{formatBRL(precoCentavos!)}</p>
            </div>
          </div>
          <Link
            href="/inscricao"
            className="mt-5 block rounded-full bg-simp-teal py-3 text-center font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep"
          >
            Comprar ingresso
          </Link>
        </>
      )}
      <Link href="/meus-ingressos" className="mt-4 block text-center text-sm font-semibold text-simp-teal underline">
        Já se inscreveu? Ver meus ingressos
      </Link>
    </div>
  )
}
