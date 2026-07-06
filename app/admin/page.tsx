import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { supabase } from '@/lib/supabase'
import { formatBRL } from '@/lib/money'
import { PedidosTable, type PedidoRow } from '@/components/admin/PedidosTable'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminQuickActions } from '@/components/admin/AdminQuickActions'
import { Users, CircleCheck, Clock, CircleX, Wallet, Hourglass, Gauge } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  if (!isCookieAdmin()) redirect('/admin/login')

  const config = await getEventConfig()
  const { data: pedidosData } = await supabase
    .from('pedidos')
    .select(
      'id, codigo, comprador_nome, comprador_cpf, comprador_telefone, quantidade, valor_total_centavos, status, metodo_comprovante, comprovante_path, observacao_admin, created_at, lotes(nome), ingressos(id, nome, cpf, data_nascimento, telefone, status)'
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
    { label: 'Inscritos válidos', valor: String(inscritos), Icon: Users, tom: 'brand' as const },
    { label: 'Pedidos pagos', valor: String(pagos.length), Icon: CircleCheck, tom: 'brand' as const },
    { label: 'Pendentes', valor: String(pendentes.length), Icon: Clock, tom: 'accent' as const },
    { label: 'Cancelados', valor: String(cancelados.length), Icon: CircleX, tom: 'red' as const },
    { label: 'Receita confirmada', valor: formatBRL(receitaConfirmada), Icon: Wallet, tom: 'brand' as const },
    { label: 'Receita pendente', valor: formatBRL(receitaPendente), Icon: Hourglass, tom: 'accent' as const },
    {
      label: 'Capacidade',
      valor: capacidade > 0 ? `${inscritos}/${capacidade}` : 'Ilimitada',
      Icon: Gauge,
      tom: 'brand' as const,
    },
  ]

  const tomClasse: Record<string, string> = {
    brand: 'bg-brand/10 text-brand',
    accent: 'bg-accent-tint/40 text-accent-hover',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <>
      <AdminHeader active="dashboard" />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-brand">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/60">Visão geral das inscrições e pagamentos.</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c, i) => (
            <div
              key={c.label}
              className="animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-card transition hover:shadow-card-hover"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${tomClasse[c.tom]}`}>
                <c.Icon size={18} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink/55">{c.label}</p>
              <p className="mt-0.5 text-2xl font-extrabold text-brand">{c.valor}</p>
            </div>
          ))}
        </div>

        <AdminQuickActions />

        <PedidosTable pedidos={pedidos} />
      </main>
    </>
  )
}
