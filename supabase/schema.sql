-- ============================================================
-- Simpósio de Audiologia e Otoneurologia — schema
-- Aplicar no SQL Editor do Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- event_config (linha única, id = 1) ----------
create table if not exists event_config (
  id                  int primary key default 1,
  nome                text not null,
  subtitulo           text,
  data_inicio         timestamptz not null,
  data_fim            timestamptz not null,
  local               text,
  tags                text,
  banner_url          text,
  pix_chave           text not null,
  pix_nome_recebedor  text not null,
  pix_cidade          text not null,
  whatsapp_numero     text,
  capacidade          int not null default 0,
  inscricoes_abertas  boolean not null default true,
  updated_at          timestamptz not null default now(),
  constraint event_config_singleton check (id = 1)
);

-- ---------- lotes ----------
create table if not exists lotes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  preco_centavos  int not null check (preco_centavos >= 0),
  data_inicio     timestamptz not null,
  data_fim        timestamptz not null,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  constraint lote_periodo check (data_fim >= data_inicio)
);

-- ---------- pedidos ----------
create table if not exists pedidos (
  id                       uuid primary key default gen_random_uuid(),
  codigo                   text not null unique,
  comprador_nome           text not null,
  comprador_cpf            text not null,
  comprador_telefone       text not null,
  lote_id                  uuid not null references lotes(id) on delete restrict,
  preco_unitario_centavos  int not null,
  quantidade               int not null check (quantidade >= 1),
  valor_total_centavos     int not null,
  status                   text not null default 'pendente'
                           check (status in ('pendente','pago','cancelado')),
  comprovante_path         text,
  metodo_comprovante       text not null default 'nenhum'
                           check (metodo_comprovante in ('upload','whatsapp','nenhum')),
  pago_em                  timestamptz,
  observacao_admin         text,
  created_at               timestamptz not null default now()
);
create index if not exists idx_pedidos_status on pedidos(status);
create index if not exists idx_pedidos_cpf    on pedidos(comprador_cpf);
create index if not exists idx_pedidos_lote   on pedidos(lote_id);

-- ---------- ingressos ----------
create table if not exists ingressos (
  id               uuid primary key default gen_random_uuid(),
  pedido_id        uuid not null references pedidos(id) on delete cascade,
  nome             text not null,
  cpf              text not null,
  data_nascimento  date not null,
  telefone         text not null,
  status           text not null default 'valido'
                   check (status in ('valido','cancelado')),
  checkin_em       timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists idx_ingressos_pedido on ingressos(pedido_id);
create index if not exists idx_ingressos_cpf    on ingressos(cpf);

-- ---------- checkins (log de entradas — evento multi-dia / reentrada) ----------
create table if not exists checkins (
  id           uuid primary key default gen_random_uuid(),
  ingresso_id  uuid not null references ingressos(id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index if not exists idx_checkins_ingresso on checkins(ingresso_id);

-- ---------- RLS: travar acesso anônimo (service role faz bypass) ----------
alter table event_config enable row level security;
alter table lotes        enable row level security;
alter table pedidos      enable row level security;
alter table ingressos    enable row level security;
alter table checkins     enable row level security;
-- Nenhuma policy: somente a service-role key (server-side) acessa.

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('evento-assets', 'evento-assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', false)
on conflict (id) do nothing;

-- ---------- Seed do event_config (dados do simpósio) ----------
insert into event_config (
  id, nome, subtitulo, data_inicio, data_fim, local, tags,
  pix_chave, pix_nome_recebedor, pix_cidade, whatsapp_numero,
  capacidade, inscricoes_abertas
) values (
  1,
  '1º Simpósio de Audiologia e Otoneurologia do Oeste do Paraná',
  'Ciência que conecta a audição, o equilíbrio e a vida.',
  '2026-11-20T08:00:00-03:00',
  '2026-11-21T18:00:00-03:00',
  'Cascavel, Paraná',
  'Audição • Equilíbrio • Ciência • Conexão',
  'CHAVE_PIX_AQUI',
  'NOME RECEBEDOR',
  'CASCAVEL',
  '5545999999999',
  0,
  true
)
on conflict (id) do nothing;
