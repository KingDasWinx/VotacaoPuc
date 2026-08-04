import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'
import { toCsv } from '@/lib/csv'
import { buildXlsx, buildPdf } from '@/lib/export-format'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'

type Rows = (string | number)[][]
type Formato = 'csv' | 'xlsx' | 'pdf'

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'participantes'
  const formatoRaw = request.nextUrl.searchParams.get('formato') ?? 'csv'
  const formato: Formato = (['csv', 'xlsx', 'pdf'] as const).includes(formatoRaw as Formato)
    ? (formatoRaw as Formato)
    : 'csv'

  if (tipo === 'pagamentos') {
    const { data, error } = await supabase
      .from('pedidos')
      .select('codigo, comprador_nome, comprador_cpf, comprador_telefone, quantidade, valor_total_centavos, status, metodo_comprovante, pago_em, created_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
    const rows: Rows = [
      ['Codigo', 'Comprador', 'CPF', 'Telefone', 'Qtd', 'Valor', 'Status', 'Comprovante', 'Pago em', 'Criado em'],
      ...(data ?? []).map((p) => [
        p.codigo, p.comprador_nome, formatCpf(p.comprador_cpf), p.comprador_telefone,
        p.quantidade, formatBRL(p.valor_total_centavos), p.status, p.metodo_comprovante,
        p.pago_em ?? '', p.created_at,
      ]),
    ]
    return await serialize(rows, 'pagamentos', 'Pagamentos', formato)
  }

  // participantes (credenciamento) — ingressos válidos de pedidos pagos
  const { data, error } = await supabase
    .from('ingressos')
    .select('nome, cpf, data_nascimento, telefone, categoria, status, pedidos!inner(codigo, status)')
    .eq('status', 'valido')
    .eq('pedidos.status', 'pago')
    .order('nome', { ascending: true })
  if (error) return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  const rows: Rows = [
    ['Nome', 'CPF', 'Nascimento', 'Telefone', 'Categoria', 'Pedido'],
    ...(data ?? []).map((i) => {
      const pedidoRel = i.pedidos as unknown as { codigo: string } | { codigo: string }[]
      const codigo = Array.isArray(pedidoRel) ? pedidoRel[0]?.codigo : pedidoRel?.codigo
      const categoria = i.categoria[0].toUpperCase() + i.categoria.slice(1)
      return [i.nome, formatCpf(i.cpf), i.data_nascimento, i.telefone, categoria, codigo ?? '']
    }),
  ]
  return await serialize(rows, 'credenciamento', 'Credenciamento', formato)
}

async function serialize(rows: Rows, baseName: string, titulo: string, formato: Formato): Promise<NextResponse> {
  if (formato === 'xlsx') {
    const buf = await buildXlsx(titulo, rows)
    return fileResponse(buf, `${baseName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }
  if (formato === 'pdf') {
    const buf = buildPdf(titulo, rows)
    return fileResponse(buf, `${baseName}.pdf`, 'application/pdf')
  }
  return fileResponse(toCsv(rows), `${baseName}.csv`, 'text/csv; charset=utf-8')
}

function fileResponse(body: string | Buffer, filename: string, contentType: string): NextResponse {
  return new NextResponse(body as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
