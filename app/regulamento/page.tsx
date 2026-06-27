import { SiteHeader } from '@/components/event/SiteHeader'
import { ScrollText } from 'lucide-react'

export const metadata = { title: 'Regulamento' }

// ponytail: conteúdo fictício de exemplo — substituir pelo regulamento real do evento.
const SECOES: { titulo: string; itens: string[] }[] = [
  {
    titulo: '1. Das inscrições',
    itens: [
      'As inscrições são realizadas exclusivamente pelo site oficial do evento, mediante preenchimento dos dados de cada participante.',
      'Cada ingresso é pessoal e intransferível, vinculado ao CPF informado no ato da inscrição.',
      'A inscrição só é confirmada após a aprovação do comprovante de pagamento pela organização.',
    ],
  },
  {
    titulo: '2. Do pagamento',
    itens: [
      'O pagamento é feito via PIX, utilizando o QR Code ou a chave copia-e-cola disponibilizados na tela do pedido.',
      'O comprovante deve ser enviado pelo próprio site ou pelo WhatsApp informado, em até 24 horas após a geração do pedido.',
      'Pedidos sem comprovante dentro do prazo poderão ser cancelados automaticamente, liberando a vaga.',
    ],
  },
  {
    titulo: '3. Das alterações e cancelamentos',
    itens: [
      'Solicitações de reembolso podem ser feitas em até 7 dias após a confirmação, desde que antes do início do evento.',
      'A organização pode alterar datas, local ou programação por motivos de força maior, comunicando os participantes com antecedência.',
      'Em caso de cancelamento do evento pela organização, o valor pago será integralmente devolvido.',
    ],
  },
  {
    titulo: '4. Do credenciamento e do dia do evento',
    itens: [
      'O credenciamento é feito na entrada mediante apresentação de documento oficial com foto correspondente ao CPF da inscrição.',
      'É recomendável chegar com pelo menos 30 minutos de antecedência para evitar filas.',
      'O certificado de participação é emitido apenas para inscritos com presença registrada.',
    ],
  },
  {
    titulo: '5. Disposições gerais',
    itens: [
      'Ao concluir a inscrição, o participante declara estar de acordo com todos os termos deste regulamento.',
      'Os dados pessoais são utilizados apenas para fins de organização do evento, conforme a LGPD.',
      'Casos omissos serão resolvidos pela comissão organizadora.',
    ],
  },
]

export default function RegulamentoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Informações</p>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <ScrollText size={20} />
            </span>
            Regulamento
          </h1>
          <p className="mt-2 rounded-xl border border-accent/30 bg-accent-tint/20 px-4 py-2.5 text-sm text-ink/70">
            Exemplo fictício para demonstração. Substitua pelo regulamento oficial do evento.
          </p>
        </div>

        <div className="animate-fade-up mt-8 space-y-6" style={{ animationDelay: '80ms' }}>
          {SECOES.map((s) => (
            <section key={s.titulo} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="font-bold text-brand">{s.titulo}</h2>
              <ul className="mt-3 space-y-2.5">
                {s.itens.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  )
}
