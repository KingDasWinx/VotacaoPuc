import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getEventConfig } from '@/lib/event-data'
import { buildPixPayload } from '@/lib/pix'
import { qrDataUrl } from '@/lib/qr'
import { formatBRL } from '@/lib/money'
import { PagamentoClient } from '@/components/pagamento/PagamentoClient'

export const dynamic = 'force-dynamic'

export default async function PedidoPage({ params }: { params: { codigo: string } }) {
  const config = await getEventConfig()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('codigo, comprador_nome, quantidade, valor_total_centavos, status, metodo_comprovante')
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

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Pagamento</h1>
      <p className="mt-1 text-simp-ink/70">
        Pedido <span className="font-bold">{pedido.codigo}</span> · {pedido.quantidade} ingresso(s)
      </p>

      <PagamentoClient
        codigo={pedido.codigo}
        status={pedido.status}
        valorFormatado={formatBRL(pedido.valor_total_centavos)}
        pixPayload={pixPayload}
        pixChave={config.pix_chave}
        qrDataUrl={qr}
        whatsappNumero={config.whatsapp_numero}
        jaTemComprovante={pedido.metodo_comprovante !== 'nenhum'}
      />
    </main>
  )
}
