import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import Patrocinadores from '@/components/Patrocinadores'

export const metadata = { title: 'Patrocinadores — Eleição Líder de Turma PUCPR' }

export default function PatrocinadoresPage() {
  return (
    <>
      <TopBar />
      <Header badge="Patrocinadores" />
      <div className="md:flex md:min-h-[calc(100vh-88px)]">
        <div className="bg-puc-bordeaux px-5 pt-10 pb-8 md:w-80 md:flex-shrink-0 md:px-10 md:pt-16 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
          <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2 relative z-10">Patrocinadores</p>
          <h1 className="text-white text-[32px] md:text-[40px] font-black uppercase leading-[1.05] mb-2 relative z-10">
            QUEM<br /><span className="text-pink-300">APOIA</span><br />A TURMA
          </h1>
          <p className="text-white/80 text-sm font-medium relative z-10 mb-8">Empresas parceiras que tornam esta eleição possível. Obrigado pelo apoio!</p>
          <Link
            href="/votar"
            className="relative z-10 block w-full bg-white text-puc-bordeaux text-center rounded-full py-4 text-[13px] font-extrabold uppercase tracking-widest"
          >
            ← Voltar para a votação
          </Link>
        </div>
        <div className="md:flex-1 p-4 pt-6 md:p-10">
          <Patrocinadores />
        </div>
      </div>
    </>
  )
}
