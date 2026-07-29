-- ============================================================
-- Limpar pedidos de teste (mantém lotes, config e programação)
-- Rodar no SQL Editor do Supabase.
--
-- Remove em cascata: ingressos e checkins vinculados aos pedidos.
-- NÃO remove arquivos de comprovante no bucket "comprovantes".
-- ============================================================

-- 1) Conferir o que será apagado
select
  (select count(*) from pedidos)      as pedidos,
  (select count(*) from ingressos)    as ingressos,
  (select count(*) from checkins)     as checkins;

-- 2) (Opcional) Ver os pedidos antes de excluir
-- select id, codigo, comprador_nome, status, created_at
-- from pedidos
-- order by created_at desc;

-- 3) Apagar TODOS os pedidos de teste
delete from pedidos;

-- 4) Conferir se ficou limpo
select
  (select count(*) from pedidos)      as pedidos,
  (select count(*) from ingressos)    as ingressos,
  (select count(*) from checkins)     as checkins,
  (select count(*) from lotes)        as lotes;
