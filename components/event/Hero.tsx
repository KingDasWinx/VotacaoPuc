function formatPeriodo(inicioISO: string, fimISO: string): string {
  const tz = 'America/Sao_Paulo'
  const ini = new Date(inicioISO)
  const fim = new Date(fimISO)
  const dia = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: tz }).format(d)
  const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: tz }).format(fim)
  const diaIni = dia(ini)
  const diaFim = dia(fim)
  return diaIni === diaFim ? `${diaFim} de ${mesAno}` : `${diaIni} e ${diaFim} de ${mesAno}`
}

export function Hero({
  nome, subtitulo, dataInicio, dataFim, local, tags, bannerUrl,
}: {
  nome: string
  subtitulo: string | null
  dataInicio: string
  dataFim: string
  local: string | null
  tags: string | null
  bannerUrl: string | null
}) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-simp-deep to-simp-teal text-white">
      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
      )}
      <div className="relative mx-auto max-w-3xl px-5 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-simp-aqua">1º Simpósio</p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">{nome}</h1>
        {subtitulo && <p className="mt-3 text-base text-white/90 sm:text-lg">{subtitulo}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <span className="rounded-full bg-white/15 px-4 py-2 font-semibold">📅 {formatPeriodo(dataInicio, dataFim)}</span>
          {local && <span className="rounded-full bg-white/15 px-4 py-2 font-semibold">📍 {local}</span>}
        </div>
        {tags && <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-simp-aqua">{tags}</p>}
      </div>
    </header>
  )
}
