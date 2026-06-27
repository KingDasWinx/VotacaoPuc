import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getEventConfig } from '@/lib/event-data'
import { buildPixPayload } from '@/lib/pix'
import { qrDataUrl } from '@/lib/qr'
import { formatBRL } from '@/lib/money'
import { PagamentoClient } from '@/components/pagamento/PagamentoClient'
import { SiteHeader } from '@/components/event/SiteHeader'

export const dynamic = 'force-dynamic'

function formatPeriodo(inicioISO: string, fimISO: string): string {
  const tz = 'America/Sao_Paulo'
  const ini = new Date(inicioISO)
  const fim = new Date(fimISO)
  const dia = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: tz }).format(d)
  const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: tz }).format(fim)
  return dia(ini) === dia(fim) ? `${dia(fim)} ${mesAno}` : `${dia(ini)} e ${dia(fim)} ${mesAno}`
}

export default async function PedidoPage({ params }: { params: { codigo: string } }) {
  const config = await getEventConfig()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select(
      'codigo, comprador_nome, quantidade, valor_total_centavos, status, metodo_comprovante, lotes(nome), ingressos(id, nome, status)'
    )
    .eq('codigo', params.codigo)
    .single()

  if (!pedido || !config) notFound()

  const pixPayload = buildPixPayload({
    chave: config.pix_chave,
    nome: config.pix_nome_recebedor,
    cidade: config.pix_cidade,
    valorCentavos: pedido.valor_total_centavos,
    txid: pedido.codigo,
  })
  const qr = await qrDataUrl(pixPayload)

  const loteRel = pedido.lotes as unknown as { nome: string } | { nome: string }[] | null
  const loteNome = (Array.isArray(loteRel) ? loteRel[0]?.nome : loteRel?.nome) ?? ''
  const ingressos = (pedido.ingressos ?? []) as { id: string; nome: string; status: string }[]

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Pagamento</p>
          <h1 className="mt-1 text-3xl font-extrabold text-brand">Pedido {pedido.codigo}</h1>
          <p className="mt-1 text-ink/60">{pedido.quantidade} ingresso(s)</p>
        </div>

        <PagamentoClient
          codigo={pedido.codigo}
          status={pedido.status}
          valorFormatado={formatBRL(pedido.valor_total_centavos)}
          pixPayload={pixPayload}
          pixChave={config.pix_chave}
          qrDataUrl={qr}
          whatsappNumero={config.whatsapp_numero}
          jaTemComprovante={pedido.metodo_comprovante !== 'nenhum'}
          voucherBase={{
            eventoNome: config.nome,
            periodo: formatPeriodo(config.data_inicio, config.data_fim),
            local: config.local ?? '',
            loteNome,
            codigo: pedido.codigo,
          }}
          ingressos={ingressos}
        />
      </main>
    </>
  )
}
