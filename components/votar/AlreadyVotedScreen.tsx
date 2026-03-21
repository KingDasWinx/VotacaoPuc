export default function AlreadyVotedScreen() {
  return (
    <div className="md:flex md:min-h-[calc(100vh-88px)]">
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 md:w-80 md:flex-shrink-0 md:px-10 md:pt-16 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <h1 className="text-white text-[32px] md:text-[40px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          OBRIGADO<br />PELO <span className="text-pink-300">VOTO!</span>
        </h1>
      </div>
      <div className="md:flex-1 md:flex md:items-center md:justify-center p-4 md:p-12">
        <div className="bg-white rounded shadow-md overflow-hidden w-full md:max-w-md">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M9 12l2 2 4-4"/><path d="M20 12V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/><path d="m16 19 2 2 4-4"/></svg>
            </div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">Voto Registrado!</h2>
            <p className="text-white/75 text-sm">Sua participação faz a diferença.</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Você já votou nesta eleição.<br />
              Cada aluno pode votar apenas uma vez.<br /><br />
              Aguarde o resultado ser divulgado pela coordenação.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
