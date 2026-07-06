import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig, getProgramacao } from '@/lib/event-data'
import { ProgramacaoManager } from '@/components/admin/ProgramacaoManager'
import { AdminHeader } from '@/components/admin/AdminHeader'
import type { ProgramacaoItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

function diasDoEvento(inicio: string, fim: string): string[] {
  const dias: string[] = []
  const d = new Date(inicio)
  const fimDate = new Date(fim)
  d.setHours(12, 0, 0, 0)
  fimDate.setHours(12, 0, 0, 0)
  while (d <= fimDate) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dias.push(`${y}-${m}-${day}`)
    d.setDate(d.getDate() + 1)
  }
  return dias
}

export default async function ProgramacaoAdminPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const config = await getEventConfig()
  const itens = (await getProgramacao()) as ProgramacaoItem[]
  const diasSugeridos = config ? diasDoEvento(config.data_inicio, config.data_fim) : []

  return (
    <>
      <AdminHeader active="programacao" />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-brand">Programação</h1>
          <p className="mt-1 text-sm text-ink/60">
            Monte a grade do evento por dia. A pré-visualização mostra como ficará no site.
          </p>
        </div>
        <ProgramacaoManager itensIniciais={itens} diasSugeridos={diasSugeridos} />
      </main>
    </>
  )
}
