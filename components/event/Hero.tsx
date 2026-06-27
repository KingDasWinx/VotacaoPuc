import { Calendar, MapPin } from 'lucide-react'

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
    <header className="relative overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-hover text-on-dark">
      {bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      )}

      {/* brilhos decorativos */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-accent-tint/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
        <h1
          className="animate-fade-up mt-3 text-balance text-3xl font-extrabold leading-tight sm:text-5xl"
          style={{ animationDelay: '60ms' }}
        >
          {nome}
        </h1>
        {subtitulo && (
          <p
            className="animate-fade-up mx-auto mt-4 max-w-xl text-base text-on-dark/85 sm:text-lg"
            style={{ animationDelay: '120ms' }}
          >
            {subtitulo}
          </p>
        )}
        <div
          className="animate-fade-up mt-8 flex flex-wrap justify-center gap-3 text-sm"
          style={{ animationDelay: '180ms' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold backdrop-blur">
            <Calendar size={15} className="text-accent-tint" aria-hidden /> {formatPeriodo(dataInicio, dataFim)}
          </span>
          {local && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-semibold backdrop-blur">
              <MapPin size={15} className="text-accent-tint" aria-hidden /> {local}
            </span>
          )}
        </div>
        {tags && (
          <p
            className="animate-fade-up mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-accent-tint"
            style={{ animationDelay: '240ms' }}
          >
            {tags}
          </p>
        )}
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-accent via-accent-tint to-accent" />
    </header>
  )
}
