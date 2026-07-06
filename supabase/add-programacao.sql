-- Programação científica do evento
create table if not exists programacao (
  id           uuid primary key default gen_random_uuid(),
  dia          date not null,
  hora_inicio  time not null,
  hora_fim     time,
  titulo       text not null,
  palestrante  text,
  descricao    text,
  local_sala   text,
  tipo         text not null default 'palestra'
               check (tipo in ('palestra','mesa_redonda','coffee_break','abertura','encerramento','outro')),
  ordem        int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists idx_programacao_dia_ordem on programacao(dia, ordem, hora_inicio);

alter table programacao enable row level security;
