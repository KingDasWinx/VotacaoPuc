# Sistema de Inscrição em Evento — Simpósio de Audiologia e Otoneurologia — Design Spec

**Data:** 2026-06-26
**Branch:** `ianVotacao`
**Status:** Aprovado

---

## 1. Visão Geral

Sistema de inscrição e venda de ingressos para o **1º Simpósio de Audiologia e Otoneurologia do Oeste do Paraná** (20–21 de novembro de 2026, Cascavel/PR). O usuário acessa o site, faz a inscrição informando seus dados, pode adicionar ingressos para outras pessoas na mesma sessão, e segue para uma tela de pagamento via PIX. O pagamento é **manual**: o usuário paga, anexa o comprovante na plataforma (ou envia por WhatsApp) e uma administradora confirma o pagamento por um painel administrativo completo.

Este sistema **reaproveita a base do sistema de votação** (mesma stack e padrões de segurança) e o **substitui** na branch `ianVotacao`.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Storage | Supabase Storage (banner público + comprovantes em bucket privado) |
| Rate limiting | `@upstash/ratelimit` + `@upstash/redis` |
| Geração de QR Code | `qrcode` (npm — única dependência nova) |
| Deploy | Vercel (recomendado) |

**Padrão SSR / sem backend separado:** páginas que exibem dados são **Server Components** (renderizadas no servidor). Mutações passam por **Route Handlers** server-side (mesmo padrão do sistema de votação). O `SUPABASE_SERVICE_ROLE_KEY` nunca é exposto ao browser — toda comunicação com o banco acontece no servidor.

---

## 3. Modelo de Dados (Supabase)

Todos os valores monetários são armazenados em **centavos (int)** para evitar erros de ponto flutuante.

### Tabela: `event_config` (registro único, id = 1)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int (PK) | Sempre 1 |
| nome | text | "1º Simpósio de Audiologia e Otoneurologia do Oeste do Paraná" |
| subtitulo | text | "Ciência que conecta a audição, o equilíbrio e a vida." |
| data_inicio | timestamptz | 2026-11-20 |
| data_fim | timestamptz | 2026-11-21 |
| local | text | "Cascavel, Paraná" |
| tags | text | "Audição • Equilíbrio • Ciência • Conexão" |
| banner_url | text (nullable) | URL pública do banner do evento |
| pix_chave | text | Chave PIX do recebedor (CPF/e-mail/telefone/aleatória) |
| pix_nome_recebedor | text | Nome do recebedor (vai no BR Code, máx. 25 chars) |
| pix_cidade | text | Cidade do recebedor (vai no BR Code, máx. 15 chars, ex. "CASCAVEL") |
| whatsapp_numero | text | Número para envio de comprovante (formato `5545999999999`) |
| capacidade | int | Limite total de ingressos. `0` = ilimitado |
| inscricoes_abertas | boolean | Chave-mestra que abre/fecha as inscrições |
| updated_at | timestamptz | Última edição |

A linha é criada via seed/migração com os defaults do banner do evento e editada pelo painel admin.

### Tabela: `lotes`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador único |
| nome | text | Ex. "Lote Promocional", "Lote 2", "Lote Final" |
| preco_centavos | int | Preço do ingresso em centavos (ex. 15000 = R$ 150,00) |
| data_inicio | timestamptz | Início da vigência do lote |
| data_fim | timestamptz | Fim da vigência do lote |
| ativo | boolean | Default `true`. Admin pode desativar sem apagar |
| created_at | timestamptz | Data de criação |

**Regra do lote vigente (calculada server-side):** dentre os lotes com `ativo = true` cujo período `[data_inicio, data_fim]` cobre `now()`, escolhe-se o de menor `data_inicio`. Se nenhum lote estiver vigente, o checkout fica indisponível ("Vendas não disponíveis no momento").

### Tabela: `pedidos`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador único |
| codigo | text **UNIQUE** | Código curto, aleatório e não-enumerável (ex. `SIM-7K2Q`). Identifica a URL de pagamento e a busca/atendimento |
| comprador_nome | text | Nome de quem comprou (= 1º participante) |
| comprador_cpf | text | CPF normalizado (11 dígitos) do comprador |
| comprador_telefone | text | Telefone do comprador (para contato/WhatsApp) |
| lote_id | uuid (FK → lotes.id, ON DELETE RESTRICT) | Lote vigente no momento da compra |
| preco_unitario_centavos | int | Snapshot do preço unitário no momento da compra |
| quantidade | int | Quantidade de ingressos (= nº de linhas em `ingressos`) |
| valor_total_centavos | int | `preco_unitario_centavos * quantidade` |
| status | text | `pendente` \| `pago` \| `cancelado` (default `pendente`) |
| comprovante_path | text (nullable) | Caminho do comprovante no bucket privado |
| metodo_comprovante | text | `upload` \| `whatsapp` \| `nenhum` (default `nenhum`) |
| pago_em | timestamptz (nullable) | Quando o admin confirmou o pagamento |
| observacao_admin | text (nullable) | Anotação livre da administradora |
| created_at | timestamptz | Data da inscrição |

### Tabela: `ingressos`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador único |
| pedido_id | uuid (FK → pedidos.id, ON DELETE CASCADE) | Pedido ao qual pertence |
| nome | text | Nome do participante |
| cpf | text | CPF normalizado (11 dígitos) do participante |
| data_nascimento | date | Data de nascimento do participante |
| telefone | text | Telefone do participante |
| status | text | `valido` \| `cancelado` (default `valido`) |
| created_at | timestamptz | Data de criação |

**Status em dois níveis:**
- **Pagamento** vive no `pedido` (`pendente`/`pago`/`cancelado`) — um PIX por pedido.
- **Cancelamento individual** vive no `ingresso` (`valido`/`cancelado`) — cobre o caso "comprou duas vezes, cancela um ingresso".

**Relação com a busca por CPF:** o 1º bloco do formulário são os dados do próprio comprador (= ingresso #1). A busca em `/meus-ingressos` procura o CPF tanto em `pedidos.comprador_cpf` quanto em `ingressos.cpf`, então tanto comprador quanto participantes encontram seus ingressos.

---

## 4. Rotas

### Públicas (Server Components — SSR)

| Rota | Descrição |
|---|---|
| `/` | Página do evento (estilo Sympla): banner, infos, preço do lote vigente, CTA "Comprar ingresso" |
| `/inscricao` | Checkout: blocos de participante + stepper de quantidade + resumo do total → cria pedido → redireciona para `/pedido/[codigo]` |
| `/pedido/[codigo]` | Tela de pagamento: QR Code PIX + botão "Copiar código PIX", valor total, anexar comprovante, botão WhatsApp, status atual |
| `/meus-ingressos` | Busca por CPF → lista pedidos/ingressos e seus status, com link para cada tela de pagamento |

### Admin (protegidas por cookie de sessão)

| Rota | Descrição |
|---|---|
| `/admin/login` | Formulário de senha do admin |
| `/admin` | Dashboard: cards de métricas + tabela de pedidos com filtros e ações |
| `/admin/lotes` | CRUD de lotes |
| `/admin/configuracoes` | Edição do `event_config` |

### Route Handlers (mutações — servidor)

| Rota | Método | Descrição |
|---|---|---|
| `/api/inscricao` | POST | Cria pedido + ingressos. Valida dados, calcula preço do lote vigente server-side, enforça capacidade, gera `codigo`, retorna `codigo` |
| `/api/comprovante` | POST | Upload do comprovante (multipart) para bucket privado, anexa ao pedido, seta `metodo_comprovante = upload` |
| `/api/meus-ingressos` | POST | Busca por CPF (POST para não vazar CPF na URL/logs) → retorna pedidos/ingressos |
| `/api/admin/login` | POST | Compara senha (constant-time) e cria cookie de sessão |
| `/api/admin/logout` | POST | Limpa o cookie de sessão |
| `/api/admin/pedidos/[id]/status` | POST | Marca pedido como `pago` ou `cancelado` |
| `/api/admin/ingressos/[id]/cancel` | POST | Cancela um ingresso individual |
| `/api/admin/lotes` | GET/POST/PATCH/DELETE | CRUD de lotes |
| `/api/admin/config` | GET/PATCH | Lê/atualiza o `event_config` |
| `/api/admin/comprovante/[pedidoId]` | GET | Gera URL assinada (curta) do comprovante para o admin visualizar |
| `/api/admin/export` | GET | Exporta CSV (credenciamento + pagamentos) |
| `/api/upload` | POST | Upload de imagem genérica (banner do evento) para bucket público — reaproveitado do sistema atual |

---

## 5. PIX (manual, dinâmico)

1. O servidor monta o **"PIX Copia e Cola" (BR Code padrão EMV do Banco Central)** a partir do `event_config` (`pix_chave`, `pix_nome_recebedor`, `pix_cidade`) **com o valor total do pedido embutido** e `txid` derivado do `codigo` do pedido, incluindo o dígito verificador **CRC16-CCITT (0xFFFF)**. Implementado em util próprio `lib/pix.ts` (sem dependência externa para o BR Code).
2. O **QR Code** é gerado a partir desse payload com a lib `qrcode` (server-side → Data URL) e renderizado como `<img>` na tela de pagamento.
3. Botão principal **"Copiar código PIX"** copia o payload copia-e-cola completo (é o que o usuário cola no app do banco). A chave PIX também é exibida em texto puro.
4. Fluxo de confirmação (**manual**):
   - Usuário paga no app do banco.
   - **Opção A:** anexa o comprovante (print/PDF) na plataforma → vai para o bucket **privado** `comprovantes`.
   - **Opção B:** clica em "Enviar comprovante por WhatsApp" → abre `https://wa.me/<whatsapp_numero>?text=...` com mensagem pré-preenchida contendo o código do pedido.
   - A administradora confere e marca o pedido como **pago** no painel.

**Nota:** o BR Code gerado é um PIX estático-com-valor (não há cobrança via API/PSP nem webhook). A baixa é sempre manual.

---

## 6. Regras de Negócio

- **Multi-ingresso:** o checkout coleta o 1º ingresso (dados do próprio comprador) e permite "+ Adicionar ingresso para outra pessoa" (nome, CPF, data de nascimento, telefone por participante). Um único pagamento (PIX) cobre o pedido inteiro.
- **Preço sempre server-side:** o preço unitário é o do lote vigente calculado no servidor no momento da criação do pedido (`/api/inscricao`). O cliente nunca informa preço.
- **Capacidade:** se `event_config.capacidade > 0`, o servidor conta os ingressos de pedidos com status `pendente` **ou** `pago` (ingressos `cancelado` não contam) e rejeita a criação que ultrapasse o limite, retornando "Esgotado". `capacidade = 0` significa ilimitado.
- **Inscrições abertas:** se `inscricoes_abertas = false` ou não houver lote vigente, o checkout fica indisponível.
- **Pedidos pendentes não expiram automaticamente** — a administradora cancela manualmente quando necessário (ex.: compra duplicada).

---

## 7. Dashboard Admin

- **Cards de visão geral:** total de inscritos (ingressos `valido`), pedidos pagos / pendentes / cancelados, receita confirmada (R$), receita pendente (R$), ingressos por lote, % da capacidade utilizada.
- **Tabela de pedidos:** colunas código, comprador, telefone, qtd de ingressos, lote, valor, status, comprovante (abre via URL assinada), data. **Filtros:** por status, por lote, e **busca** por nome/CPF/código.
- **Ações por pedido:** marcar pago · cancelar pedido · cancelar ingresso individual · ver participantes · adicionar/editar observação · **botão WhatsApp** (abre conversa com `comprador_telefone`, mensagem pré-preenchida com o código do pedido).
- **Exportar CSV:** lista de credenciamento (participantes válidos) e lista de pagamentos.
- **Gerenciar lotes:** criar, editar, ativar/desativar.
- **Configurações do evento:** editar todos os campos de `event_config` (datas, local, chave PIX e dados do recebedor, número de WhatsApp, capacidade, banner, abrir/fechar inscrições).

---

## 8. Segurança

- `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` somente em `.env.local` (servidor). O browser nunca recebe credenciais do Supabase.
- **Admin:** senha em `ADMIN_PASSWORD` (env). Login compara em tempo constante e cria um cookie **httpOnly**, assinado com HMAC (`ADMIN_SESSION_SECRET`). Um **middleware** protege `/admin/*` (exceto `/admin/login`) e `/api/admin/*`, redirecionando/retornando `401` sem sessão válida.
- **Comprovantes em bucket privado** `comprovantes`. O admin visualiza por **URL assinada** de curta duração gerada server-side. O bucket público é só para o banner.
- **Rate limiting** (Upstash) em todos os POST: `/api/inscricao`, `/api/comprovante`, `/api/meus-ingressos`, `/api/admin/login`.
- **Preço e capacidade recalculados server-side** — o cliente nunca é fonte de verdade.
- **`codigo` do pedido aleatório** e não-enumerável (a tela `/pedido/[codigo]` não pode ser varrida).
- **Validação de CPF:** 11 dígitos (normalização `replace(/\D/g, '')`); validação de dígitos verificadores opcional.

---

## 9. Variáveis de Ambiente

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

- `ADMIN_PASSWORD`: senha de acesso ao painel administrativo.
- `ADMIN_SESSION_SECRET`: segredo forte para assinar o cookie de sessão (HMAC).
- Nenhuma variável `NEXT_PUBLIC_SUPABASE_*` é exposta ao cliente.

---

## 10. Design Visual (estilo Sympla)

**Layout:** mobile-first responsivo, com container centrado e largura confortável no desktop (mais largo que o sistema de votação atual).

**Identidade:** substitui o tema bordô da PUCPR por uma identidade do simpósio — paleta **azul-petróleo/teal + accent**, evocando audição / equilíbrio / ciência, com a faixa "Audição • Equilíbrio • Ciência • Conexão".

| Tela | Elementos |
|---|---|
| `/` (evento) | Hero com banner, título do evento, chips de data (20–21/11/2026) e local (Cascavel/PR), subtítulo, caixa de ingresso estilo Sympla com nome do lote vigente + preço + CTA "Comprar ingresso". Seções de "sobre o evento" e "local" |
| `/inscricao` | Stepper de quantidade, formulários de participante (1º = comprador), resumo fixo/sticky com total, botão "Ir para pagamento" |
| `/pedido/[codigo]` | Card com QR Code PIX, botão "Copiar código PIX", chave em texto, valor total, badge de status, área de anexar comprovante, botão "Enviar por WhatsApp", instruções |
| `/meus-ingressos` | Campo de CPF + lista de pedidos com status e link para pagamento |
| `/admin/*` | Layout administrativo distinto (não-Sympla): tabela densa, filtros, cards de métricas |

---

## 11. Fora do Escopo (YAGNI)

- Envio de e-mail (confirmação fica na tela + WhatsApp).
- Gateway de pagamento / webhook (baixa é sempre manual).
- Múltiplos eventos.
- Múltiplas categorias de ingresso (apenas tipo único; preço varia só por lote).
- Login com senha para o usuário final (acesso por CPF).
- Reembolso automatizado.
