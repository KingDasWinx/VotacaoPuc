# Inscrições — Simpósio de Audiologia e Otoneurologia do Oeste do Paraná

Sistema de inscrição e venda de ingressos por PIX manual, com painel administrativo.

## Stack
Next.js 14 (App Router), TypeScript, Tailwind, Supabase (Postgres + Storage), Upstash Ratelimit.

## Setup
1. Copie `.env.local.example` para `.env.local` e preencha as variáveis.
2. Aplique `supabase/schema.sql` no SQL Editor do Supabase (cria tabelas, buckets e seed).
3. Ajuste o `event_config` (chave PIX, recebedor, WhatsApp) via `/admin/configuracoes`.
4. Crie ao menos um lote vigente em `/admin/lotes`.

## Scripts
- `npm run dev` — desenvolvimento
- `npm test` — testes de lógica pura (Vitest)
- `npm run build` — build de produção
- `npm run lint` — lint

## Rotas
- `/` landing · `/inscricao` checkout · `/pedido/[codigo]` pagamento · `/meus-ingressos` busca por CPF
- `/admin` dashboard · `/admin/lotes` · `/admin/configuracoes` (login em `/admin/login`)

## Segurança
Credenciais Supabase e admin ficam só no servidor. Acesso ao banco via Route Handlers/Server Components. Comprovantes em bucket privado (URL assinada para o admin). Rate limiting nos POST. PIX é BR Code com baixa manual.
