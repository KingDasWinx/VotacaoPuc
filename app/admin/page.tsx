import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { supabase } from '@/lib/supabase'
import { formatBRL } from '@/lib/money'
import { PedidosTable, type PedidoRow } from '@/components/admin/PedidosTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  if (!isCookieAdmin()) redirect('/admin/login')

  const config = await getEventConfig()
  const { data: pedidosData } = await supabase
    .from('pedidos')
    .select(
      'id, codigo, comprador_nome, comprador_cpf, comprador_telefone, quantidade, valor_total_centavos, status, metodo_comprovante, comprovante_path, observacao_admin, created_at, lotes(nome), ingressos(id, nome, cpf, status)'
    )
    .order('created_at', { ascending: false })

  const pedidos: PedidoRow[] = (pedidosData ?? []).map((p) => {
    const loteRel = p.lotes as unknown as { nome: string } | { nome: string }[] | null
    const loteNome = Array.isArray(loteRel) ? loteRel[0]?.nome : loteRel?.nome
    return {
      id: p.id,
      codigo: p.codigo,
      comprador_nome: p.comprador_nome,
      comprador_cpf: p.comprador_cpf,
      comprador_telefone: p.comprador_telefone,
      quantidade: p.quantidade,
      valor_total_centavos: p.valor_total_centavos,
      status: p.status,
      metodo_comprovante: p.metodo_comprovante,
      tem_comprovante: Boolean(p.comprovante_path),
      observacao_admin: p.observacao_admin,
      lote_nome: loteNome ?? '',
      ingressos: p.ingressos as PedidoRow['ingressos'],
    }
  })

  // Métricas
  const inscritos = pedidos
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + p.ingressos.filter((i) => i.status === 'valido').length, 0)
  const pagos = pedidos.filter((p) => p.status === 'pago')
  const pendentes = pedidos.filter((p) => p.status === 'pendente')
  const cancelados = pedidos.filter((p) => p.status === 'cancelado')
  const receitaConfirmada = pagos.reduce((a, p) => a + p.valor_total_centavos, 0)
  const receitaPendente = pendentes.reduce((a, p) => a + p.valor_total_centavos, 0)
  const capacidade = config?.capacidade ?? 0

  const cards = [
    { label: 'Inscritos (válidos)', valor: String(inscritos) },
    { label: 'Pedidos pagos', valor: String(pagos.length) },
    { label: 'Pendentes', valor: String(pendentes.length) },
    { label: 'Cancelados', valor: String(cancelados.length) },
    { label: 'Receita confirmada', valor: formatBRL(receitaConfirmada) },
    { label: 'Receita pendente', valor: formatBRL(receitaPendente) },
    { label: 'Capacidade', valor: capacidade > 0 ? `${inscritos}/${capacidade}` : 'Ilimitada' },
  ]

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-simp-deep">Dashboard</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/lotes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">Lotes</Link>
          <Link href="/admin/configuracoes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">Configurações</Link>
          <a href="/api/admin/export?tipo=participantes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">CSV credenciamento</a>
          <a href="/api/admin/export?tipo=pagamentos" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">CSV pagamentos</a>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-full bg-simp-deep px-4 py-2 font-semibold text-white">Sair</button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-simp-mist bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-simp-ink/60">{c.label}</p>
            <p className="mt-1 text-xl font-extrabold text-simp-deep">{c.valor}</p>
          </div>
        ))}
      </div>

      <PedidosTable pedidos={pedidos} />
    </main>
  )
}
