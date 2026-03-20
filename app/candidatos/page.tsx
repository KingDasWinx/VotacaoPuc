import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import RegisterClient from '@/components/candidatos/RegisterClient'

export const dynamic = 'force-dynamic'

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>
}) {
  const params = await searchParams
  const secret = params.secret ?? ''
  const expectedSecret = process.env.CANDIDATO_SECRET ?? ''

  if (!secret || secret !== expectedSecret) {
    return (
      <>
        <TopBar />
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-black uppercase text-puc-bordeaux mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Esta página é restrita aos candidatos.<br />
            Use o link enviado pelo organizador da eleição.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <Header badge="Candidatura" />
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden mb-6">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2 relative z-10">Candidatura</p>
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          CADASTRE<br />SUA <span className="text-pink-300">CHAPA</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">Preencha seus dados para concorrer à liderança de turma.</p>
      </div>
      <div className="flex items-center gap-2.5 px-4 pb-4">
        <div className="w-1 h-[22px] bg-puc-bordeaux rounded-sm" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-gray-800">Seus dados</h2>
      </div>
      <RegisterClient secret={secret} />
    </>
  )
}
