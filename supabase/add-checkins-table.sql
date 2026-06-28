-- Migration: log de check-ins (evento multi-dia / reentrada).
-- Rodar no SQL Editor do Supabase em bancos já existentes.
create table if not exists checkins (
  id           uuid primary key default gen_random_uuid(),
  ingresso_id  uuid not null references ingressos(id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index if not exists idx_checkins_ingresso on checkins(ingresso_id);
alter table checkins enable row level security;

-- checkin_em em ingressos passa a guardar a ÚLTIMA entrada (mantido por conveniência).
alter table ingressos add column if not exists checkin_em timestamptz;
