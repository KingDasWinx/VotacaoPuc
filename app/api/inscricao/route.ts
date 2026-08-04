import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateInscricao } from '@/lib/inscricao-validation'
import { selectCurrentLote } from '@/lib/lotes'
import { generateCodigo } from '@/lib/codigo'
import { inscricaoRatelimit, getClientIp } from '@/lib/ratelimit'
import type { Lote } from '@/lib/types'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await inscricaoRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const validated = validateInscricao(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const { participantes } = validated

  // Config + inscrições abertas
  const { data: config, error: configErr } = await supabase
    .from('event_config')
    .select('capacidade, inscricoes_abertas')
    .eq('id', 1)
    .single()
  if (configErr || !config) {
    return NextResponse.json({ error: 'Configuração do evento não encontrada' }, { status: 500 })
  }
  if (!config.inscricoes_abertas) {
    return NextResponse.json({ error: 'As inscrições estão encerradas' }, { status: 403 })
  }

  // Lote vigente (server-side)
  const { data: lotes, error: lotesErr } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo')
  if (lotesErr) {
    return NextResponse.json({ error: 'Erro ao carregar lotes' }, { status: 500 })
  }
  const lote = selectCurrentLote((lotes ?? []) as Lote[], new Date())
  if (!lote) {
    return NextResponse.json({ error: 'Vendas não disponíveis no momento' }, { status: 403 })
  }

  // Capacidade (conta ingressos válidos de pedidos não cancelados)
  if (config.capacidade > 0) {
    const { count, error: countErr } = await supabase
      .from('ingressos')
      .select('id, pedidos!inner(status)', { count: 'exact', head: true })
      .eq('status', 'valido')
      .neq('pedidos.status', 'cancelado')
    if (countErr) {
      return NextResponse.json({ error: 'Erro ao verificar capacidade' }, { status: 500 })
    }
    if ((count ?? 0) + participantes.length > config.capacidade) {
      return NextResponse.json({ error: 'Ingressos esgotados' }, { status: 409 })
    }
  }

  const quantidade = participantes.length
  const precoUnit = lote.preco_centavos
  const valorTotal = precoUnit * quantidade
  const comprador = participantes[0]

  // Insere pedido com código único (retry em colisão)
  let pedidoId: string | null = null
  let codigo = ''
  for (let attempt = 0; attempt < 5 && !pedidoId; attempt++) {
    codigo = generateCodigo()
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        codigo,
        comprador_nome: comprador.nome,
        comprador_cpf: comprador.cpf,
        comprador_telefone: comprador.telefone,
        lote_id: lote.id,
        preco_unitario_centavos: precoUnit,
        quantidade,
        valor_total_centavos: valorTotal,
        status: 'pendente',
        metodo_comprovante: 'nenhum',
      })
      .select('id')
      .single()
    if (!error && data) {
      pedidoId = data.id
    } else if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }
  }
  if (!pedidoId) {
    return NextResponse.json({ error: 'Não foi possível gerar o pedido' }, { status: 500 })
  }

  // Insere ingressos
  const { error: ingressosErr } = await supabase.from('ingressos').insert(
    participantes.map((p) => ({
      pedido_id: pedidoId,
      nome: p.nome,
      cpf: p.cpf,
      data_nascimento: p.data_nascimento,
      telefone: p.telefone,
      categoria: p.categoria,
      status: 'valido',
    }))
  )
  if (ingressosErr) {
    // limpeza best-effort do pedido órfão
    await supabase.from('pedidos').delete().eq('id', pedidoId)
    return NextResponse.json({ error: 'Erro ao registrar ingressos' }, { status: 500 })
  }

  return NextResponse.json({ codigo }, { status: 201 })
}
