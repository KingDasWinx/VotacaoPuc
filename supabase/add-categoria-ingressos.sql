-- Categoria dos participantes. Registros anteriores ficam pendentes para revisão administrativa.
alter table ingressos
  add column if not exists categoria text not null default 'pendente'
  check (categoria in ('pendente', 'estudante', 'profissional'));
