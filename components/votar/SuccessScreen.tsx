export default function SuccessScreen() {
  return (
    <div>
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          OBRIGADO<br />PELO <span className="text-pink-300">VOTO!</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">Sua participação faz a diferença.</p>
      </div>
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">Voto Registrado!</h2>
            <p className="text-white/75 text-sm">Seu voto foi contabilizado com sucesso.</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Aguarde o resultado ser divulgado<br />pela coordenação do curso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
