# Sistema de Votação PUCPR — Design Spec

**Data:** 2026-03-20
**Status:** Aprovado

---

## 1. Visão Geral

Sistema de votação para eleição de líder de turma da PUCPR. Uma turma única. Os candidatos se cadastram via link privado enviado pelo organizador. Os alunos votam pela página pública de votação. O resultado fica disponível diretamente no Supabase para o organizador.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Storage | Supabase Storage (fotos dos candidatos) |
| Deploy | Vercel (recomendado) |

---

## 3. Rotas

| Rota | Visibilidade | Descrição |
|---|---|---|
| `/votar` | Pública | Tela de votação com todos os candidatos |
| `/candidatos` | Privada (link secreto) | Formulário de cadastro de candidatos |
| `/api/candidatos` | Servidor | GET lista candidatos / POST cadastra candidato |
| `/api/votos` | Servidor | POST registra voto |
| `/api/config` | Servidor | GET retorna data/hora de abertura da votação |
| `/api/upload` | Servidor | POST faz upload de foto para Supabase Storage |

A rota `/candidatos` não é linkada em nenhum lugar do site — é acessada somente por quem recebe o link diretamente.

---

## 4. Banco de Dados (Supabase)

### Tabela: `candidatos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador único |
| nome | text **UNIQUE** (normalizado) | Nome do candidato (aparece na votação) |
| frase | text | Frase de campanha — `CHECK (char_length(frase) <= 80)` |
| foto_url | text | URL pública da foto no Supabase Storage |
| created_at | timestamptz | Data de cadastro |

Normalização de `nome`: `trim()` + `toLowerCase()` aplicados server-side antes de insert e checagem. `409 Conflict` retornado se nome já existir.

### Tabela: `votos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid (PK) | Identificador único |
| candidato_id | uuid (FK → candidatos.id, **ON DELETE RESTRICT**) | Candidato escolhido |
| nome_votante | text | Nome normalizado (trim + lowercase) — `UNIQUE` |
| created_at | timestamptz | Data/hora do voto |

### Tabela: `config`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | int (PK) | Sempre 1 (registro único) |
| votacao_inicio | timestamptz | Data/hora de abertura da votação |
| votacao_fim | timestamptz (nullable) | Data/hora de encerramento (opcional) |

A tabela `config` tem exatamente 1 linha, editada diretamente no painel do Supabase pelo organizador.

---

## 5. Segurança

- `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` existem **somente** em `.env.local` (servidor)
- O browser nunca recebe credenciais do Supabase — toda comunicação é via Route Handlers do Next.js
- Upload de foto: browser envia o arquivo para `/api/upload` → servidor valida tipo (`image/*`) e tamanho (máx. 5 MB) → faz upload para Supabase Storage → retorna URL pública
- **Proteção de `/candidatos`:** a rota exige um query param `?secret=VALOR` que deve casar com a variável de ambiente `CANDIDATO_SECRET`. Sem o secret correto, retorna `403`. O organizador inclui o secret no link enviado aos candidatos
- `POST /api/candidatos` aplica o mesmo check de `CANDIDATO_SECRET` via header ou query param
- Máximo de **20 candidatos** enforçado server-side em `POST /api/candidatos` (conta registros existentes antes de inserir)
- **Rate limiting:** todos os endpoints `POST` (`/api/votos`, `/api/candidatos`, `/api/upload`) usam `@upstash/ratelimit` com Redis (Upstash free tier). Limite: **10 requests/minuto por IP** em `/api/votos`, **5 requests/minuto por IP** em `/api/candidatos` e `/api/upload`. Retorna `429 Too Many Requests` quando excedido

---

## 6. Controle de Votação Duplicada

- Ao votar com sucesso, o browser salva `{ voted: true, timestamp }` em `localStorage` — usado como otimização de UX para pular o formulário na próxima visita
- **Server-side:** a tabela `votos` tem `UNIQUE CONSTRAINT` em `nome_votante` (após normalização). O `POST /api/votos` retorna `409 Conflict` se o nome já constar na tabela
- **Normalização do nome:** antes da inserção e da checagem, o servidor aplica `trim()` + `toLowerCase()` para evitar duplicatas por variação de caixa/espaços
- O campo de nome é exibido no bottom sheet de confirmação para o votante revisar antes de enviar

---

## 7. Controle de Data/Hora

- A página `/votar` chama `/api/config` para obter `votacao_inicio` e `votacao_fim`
- `GET /api/config` responde com `Cache-Control: public, max-age=30` para reduzir leituras desnecessárias no Supabase
- Se `Date.now() < votacao_inicio`, exibe tela de bloqueio com contagem regressiva em tempo real via `setInterval`
- Se `votacao_fim` estiver definido e `Date.now() > votacao_fim`, exibe tela "Votação encerrada"
- **Server-side:** `POST /api/votos` consulta a tabela `config` e rejeita com `403 Forbidden` se `now() < votacao_inicio` ou `now() > votacao_fim` (quando definido)
- **Comportamento de `votacao_fim = NULL`:** significa que a votação não tem prazo de encerramento — permanece aberta indefinidamente após `votacao_inicio`

---

## 8. Upload de Foto

1. Candidato seleciona foto (input `accept="image/*"` com `capture="user"` para câmera em mobile)
2. Browser envia o arquivo via `FormData` para `/api/upload`
3. Servidor faz upload para bucket `candidatos-fotos` no Supabase Storage
4. Servidor retorna a URL pública
5. URL é armazenada junto com os dados do candidato no POST para `/api/candidatos`

---

## 9. Design Visual

**Identidade:** Fiel ao site oficial da PUCPR (pucpr.br).

| Elemento | Valor |
|---|---|
| Cor primária | `#8B0033` (bordô) |
| Cor destaque | `#E8000D` (vermelho) |
| Cor secundária | `#5B0099` (roxo) |
| Fundo | `#f5f5f5` |
| Branco | `#ffffff` |
| Tipografia | Montserrat (Google Fonts) — weights 400, 600, 700, 800, 900 |
| Barra superior | `#2d2d3a` com texto "GRUPO MARISTA \| PUCPR" |
| Header | Branco com borda inferior bordô `3px` |
| Botões | Pill-shape (`border-radius: 30px`), fundo bordô, texto branco uppercase |
| Cards candidatos | Borda esquerda bordô `4px`, fundo branco, sombra suave |
| Títulos de seção | Barra vertical bordô + texto uppercase bold |

**Layout:** Mobile-first. Largura máxima 430px centrada. Sem sidebar.

---

## 10. Telas

### `/votar` — Fluxo principal

1. **Tela de Bloqueio** (se antes do horário): Hero bordô com título, card branco com contagem regressiva e data de abertura
2. **Tela Já Votou** (se `localStorage` marcado): Hero + card de confirmação
3. **Tela de Votação**: Hero + lista de candidatos em cards clicáveis
4. **Bottom Sheet de Confirmação**: Overlay escuro + modal bottom-up com resumo do candidato, campo de nome e botão confirmar
5. **Tela de Sucesso**: Hero + card "Voto registrado!" após confirmação

### `/candidatos` — Cadastro

1. Hero bordô com título "Cadastre sua chapa"
2. Área de upload de foto (câmera / galeria)
3. Campo nome completo
4. Campo frase de campanha (máx. 80 chars com contador)
5. Botão "Cadastrar candidatura"
6. Tela de sucesso após envio

---

## 11. Variáveis de Ambiente

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
CANDIDATO_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

- `CANDIDATO_SECRET`: string secreta incluída no link de cadastro (`/candidatos?secret=VALOR`). O organizador gera um valor forte e inclui no link enviado aos candidatos.
- Nenhuma variável `NEXT_PUBLIC_SUPABASE_*` é exposta ao cliente.

---

## 12. Fora do Escopo

- Painel de resultados (resultados acessados direto no Supabase)
- Autenticação de candidatos ou votantes
- Múltiplas turmas
- Edição/remoção de candidatos pelo site
- Verificação server-side de voto duplicado
