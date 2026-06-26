import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

export async function GET(request: NextRequest, { params }: { params: { pedidoId: string } }) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('comprovante_path')
    .eq('id', params.pedidoId)
    .single()
  if (error || !pedido || !pedido.comprovante_path) {
    return NextResponse.json({ error: 'Sem comprovante' }, { status: 404 })
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('comprovantes')
    .createSignedUrl(pedido.comprovante_path, 60)
  if (signErr || !signed) {
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 })
  }
  return NextResponse.json({ url: signed.signedUrl })
}
