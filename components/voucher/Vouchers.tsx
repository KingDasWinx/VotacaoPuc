'use client'

import { VoucherCard, type VoucherInfo } from './VoucherCard'

type Base = Omit<VoucherInfo, 'nome' | 'ingressoId'>

export function Vouchers({
  base,
  ingressos,
}: {
  base: Base
  ingressos: { id: string; nome: string; status: string }[]
}) {
  const validos = ingressos.filter((i) => i.status !== 'cancelado')
  if (validos.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-xl font-extrabold text-brand">
        {validos.length > 1 ? 'Seus ingressos' : 'Seu ingresso'}
      </h2>
      <p className="mt-1 text-sm text-ink/60">
        Salve {validos.length > 1 ? 'cada' : 'o'} ingresso para guardar com você.
      </p>
      <div className="mt-5 grid justify-items-center gap-8 sm:grid-cols-2">
        {validos.map((i) => (
          <VoucherCard key={i.id} info={{ ...base, nome: i.nome, ingressoId: i.id }} />
        ))}
      </div>
    </section>
  )
}
