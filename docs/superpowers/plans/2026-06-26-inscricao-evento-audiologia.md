# Sistema de Inscrição em Evento (Simpósio de Audiologia) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a base do sistema de votação na branch `ianVotacao` em um sistema de inscrição/venda de ingressos por PIX manual para o 1º Simpósio de Audiologia e Otoneurologia, com painel administrativo completo.

**Architecture:** Next.js 14 App Router. Páginas de leitura são Server Components (SSR); mutações passam por Route Handlers server-side. Supabase (Postgres + Storage) acessado só no servidor com service-role key. PIX é um BR Code EMV gerado server-side (valor embutido) com confirmação manual pela admin. Auth do admin via senha em env + cookie HMAC + middleware.

**Tech Stack:** TypeScript, Tailwind CSS, Supabase JS, Upstash Ratelimit, `qrcode` (QR), Vitest (testes de lógica pura).

## Global Constraints

- **Next.js:** 14.2.35 (App Router). Não fazer upgrade de major.
- **Path alias:** `@/*` → `./*` (definido em `tsconfig.json`). Use `@/lib/...`, `@/components/...`.
- **Dinheiro sempre em centavos (int).** Nunca usar float para preço. Formatação BRL só na borda de exibição.
- **CPF normalizado** = só dígitos (`replace(/\D/g, '')`), sempre 11 dígitos.
- **Segredos server-only:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `UPSTASH_*`. Nenhuma var `NEXT_PUBLIC_*` de Supabase. `lib/supabase.ts` nunca pode ser importado em client component.
- **Preço e capacidade são SEMPRE recalculados server-side.** O cliente nunca informa preço.
- **Idioma da UI:** Português (pt-BR). Mensagens de erro de API em português.
- **Paleta:** tema `simp` (azul-petróleo/teal) definido na Task 1; não usar mais as cores `puc`.
- **TDD:** lógica pura (`lib/*.ts` de cálculo) tem teste antes da implementação. Route handlers e UI ligados ao Supabase têm os helpers puros testados + um passo de verificação manual.
- **Commits frequentes:** um commit por task concluída.

---

## File Structure

**Bibliotecas puras (testáveis com Vitest):**
- `lib/types.ts` — tipos compartilhados (Lote, ParticipanteInput, status enums)
- `lib/money.ts` — formatação de centavos ↔ BRL
- `lib/cpf.ts` — normalização e validação de CPF
- `lib/pix.ts` — CRC16-CCITT + montagem do BR Code EMV
- `lib/lotes.ts` — seleção do lote vigente
- `lib/codigo.ts` — geração do código do pedido
- `lib/auth.ts` — HMAC de sessão + comparação constant-time
- `lib/csv.ts` — serialização CSV
- `lib/inscricao-validation.ts` — validação dos participantes do checkout

**Infra (reaproveitadas/estendidas):**
- `lib/supabase.ts` — cliente service-role (já existe, mantido)
- `lib/ratelimit.ts` — limiters (estendido)
- `middleware.ts` — proteção das rotas admin (novo)
- `supabase/schema.sql` — DDL + seed + buckets (novo)

**Route Handlers (mutações):**
- `app/api/inscricao/route.ts`
- `app/api/comprovante/route.ts`
- `app/api/meus-ingressos/route.ts`
- `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`
- `app/api/admin/pedidos/[id]/status/route.ts`
- `app/api/admin/ingressos/[id]/cancel/route.ts`
- `app/api/admin/lotes/route.ts`
- `app/api/admin/config/route.ts`
- `app/api/admin/comprovante/[pedidoId]/route.ts`
- `app/api/admin/export/route.ts`

**Páginas (Server Components + client islands):**
- `app/page.tsx` — landing do evento
- `app/inscricao/page.tsx` + `components/checkout/CheckoutClient.tsx`
- `app/pedido/[codigo]/page.tsx` + `components/pagamento/PagamentoClient.tsx`
- `app/meus-ingressos/page.tsx` + `components/ingressos/MeusIngressosClient.tsx`
- `app/admin/login/page.tsx` + `components/admin/LoginClient.tsx`
- `app/admin/page.tsx` + `components/admin/PedidosTable.tsx`
- `app/admin/lotes/page.tsx` + `components/admin/LotesManager.tsx`
- `app/admin/configuracoes/page.tsx` + `components/admin/ConfigForm.tsx`
- `components/event/` — componentes visuais compartilhados (Hero, InfoChips, TicketBox)

**Removidos na limpeza (Task 26):** `app/votar/`, `app/candidatos/`, `app/api/votos/`, `app/api/candidatos/`, `app/api/config/`, `components/votar/`, `components/candidatos/`, `lib/normalize.ts`.

---

## Task 1: Tooling (Vitest) + tema + tipos compartilhados

**Files:**
- Modify: `package.json` (deps + script `test`)
- Create: `vitest.config.ts`
- Modify: `tailwind.config.ts` (paleta `simp`)
- Create: `lib/types.ts`
- Test: `lib/__tests__/types.test.ts`

**Interfaces:**
- Produces: tipos `PedidoStatus`, `IngressoStatus`, `MetodoComprovante`, `Lote`, `ParticipanteInput`. Script `npm test` rodando Vitest.

- [ ] **Step 1: Instalar Vitest**

Run:
```bash
npm install -D vitest@^2.1.0
```
Expected: adiciona `vitest` em devDependencies.

- [ ] **Step 2: Adicionar script de teste**

Em `package.json`, no bloco `"scripts"`, adicione a linha `test` após `lint`:
```json
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 4: Adicionar paleta `simp` ao Tailwind**

Em `tailwind.config.ts`, dentro de `theme.extend.colors`, adicione a chave `simp` ao lado de `puc`:
```ts
        simp: {
          deep: '#0F3A4D',     // azul-petróleo (primária)
          teal: '#0E7C86',     // teal (destaque)
          aqua: '#23B5B5',     // accent claro
          ink: '#0B2530',      // texto escuro
          mist: '#EAF4F4',     // fundo claro de seções
          bg: '#F6F9FA',       // fundo da página
        },
```

- [ ] **Step 5: Escrever o teste de tipos (failing)**

`lib/__tests__/types.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import type { Lote, ParticipanteInput } from '@/lib/types'
import { PEDIDO_STATUS, INGRESSO_STATUS } from '@/lib/types'

describe('types', () => {
  it('expõe os status de pedido', () => {
    expect(PEDIDO_STATUS).toEqual(['pendente', 'pago', 'cancelado'])
  })
  it('expõe os status de ingresso', () => {
    expect(INGRESSO_STATUS).toEqual(['valido', 'cancelado'])
  })
  it('aceita um Lote bem formado', () => {
    const lote: Lote = {
      id: 'x', nome: 'Lote 1', preco_centavos: 15000,
      data_inicio: '2026-01-01T00:00:00Z', data_fim: '2026-02-01T00:00:00Z', ativo: true,
    }
    expect(lote.preco_centavos).toBe(15000)
  })
  it('aceita um ParticipanteInput bem formado', () => {
    const p: ParticipanteInput = {
      nome: 'Ana', cpf: '12345678909', data_nascimento: '1990-01-01', telefone: '45999999999',
    }
    expect(p.cpf).toHaveLength(11)
  })
})
```

- [ ] **Step 6: Rodar o teste e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/types'`.

- [ ] **Step 7: Criar `lib/types.ts`**

```ts
export const PEDIDO_STATUS = ['pendente', 'pago', 'cancelado'] as const
export type PedidoStatus = (typeof PEDIDO_STATUS)[number]

export const INGRESSO_STATUS = ['valido', 'cancelado'] as const
export type IngressoStatus = (typeof INGRESSO_STATUS)[number]

export const METODO_COMPROVANTE = ['upload', 'whatsapp', 'nenhum'] as const
export type MetodoComprovante = (typeof METODO_COMPROVANTE)[number]

export interface Lote {
  id: string
  nome: string
  preco_centavos: number
  data_inicio: string // ISO 8601
  data_fim: string // ISO 8601
  ativo: boolean
}

export interface ParticipanteInput {
  nome: string
  cpf: string // 11 dígitos
  data_nascimento: string // YYYY-MM-DD
  telefone: string
}
```

- [ ] **Step 8: Rodar o teste e ver passar**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tailwind.config.ts lib/types.ts lib/__tests__/types.test.ts
git commit -m "chore: add vitest, simp theme palette and shared types"
```

---

## Task 2: Util de dinheiro (`lib/money.ts`)

**Files:**
- Create: `lib/money.ts`
- Test: `lib/money.test.ts`

**Interfaces:**
- Produces: `formatBRL(centavos: number): string` → `"R$ 150,00"`; `formatPixAmount(centavos: number): string` → `"150.00"` (usado no BR Code).

- [ ] **Step 1: Escrever o teste (failing)**

`lib/money.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatBRL, formatPixAmount } from '@/lib/money'

describe('formatBRL', () => {
  it('formata centavos em reais com vírgula', () => {
    expect(formatBRL(15000)).toBe('R$ 150,00')
    expect(formatBRL(12990)).toBe('R$ 129,90')
    expect(formatBRL(0)).toBe('R$ 0,00')
    expect(formatBRL(5)).toBe('R$ 0,05')
  })
  it('agrupa milhar', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56')
  })
})

describe('formatPixAmount', () => {
  it('formata em reais com ponto e 2 casas, sem separador de milhar', () => {
    expect(formatPixAmount(15000)).toBe('150.00')
    expect(formatPixAmount(12990)).toBe('129.90')
    expect(formatPixAmount(123456)).toBe('1234.56')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/money'`.

- [ ] **Step 3: Implementar `lib/money.ts`**

```ts
/** Formata centavos como moeda brasileira: 15000 -> "R$ 150,00". */
export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}

/** Formata centavos para o campo de valor do BR Code PIX: 15000 -> "150.00". */
export function formatPixAmount(centavos: number): string {
  return (centavos / 100).toFixed(2)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

> Nota: `Intl.NumberFormat('pt-BR', currency)` usa espaço não-quebrável (U+00A0) entre "R$" e o número em alguns ambientes Node. Se o teste falhar por causa do caractere de espaço, ajuste o teste para usar ` ` OU normalize na função com `.replace(/ /g, ' ')`. Aplique a normalização na função e mantenha o teste com espaço comum.

- [ ] **Step 5: Garantir espaço comum (ajuste defensivo)**

Atualize `formatBRL` para normalizar o espaço:
```ts
export function formatBRL(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100).replace(/ /g, ' ')
}
```
Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/money.ts lib/money.test.ts
git commit -m "feat: add money formatting util (centavos to BRL and PIX amount)"
```

---

## Task 3: Util de CPF (`lib/cpf.ts`)

**Files:**
- Create: `lib/cpf.ts`
- Test: `lib/cpf.test.ts`

**Interfaces:**
- Produces: `normalizeCpf(cpf: string): string` (só dígitos); `isValidCpf(cpf: string): boolean` (11 dígitos + dígitos verificadores); `formatCpf(cpf: string): string` → `"123.456.789-09"`.

- [ ] **Step 1: Escrever o teste (failing)**

`lib/cpf.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { normalizeCpf, isValidCpf, formatCpf } from '@/lib/cpf'

describe('normalizeCpf', () => {
  it('remove tudo que não é dígito', () => {
    expect(normalizeCpf('123.456.789-09')).toBe('12345678909')
    expect(normalizeCpf(' 111 222 333 44 ')).toBe('11122233344')
  })
})

describe('isValidCpf', () => {
  it('aceita CPFs válidos', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })
  it('rejeita comprimento errado', () => {
    expect(isValidCpf('123')).toBe(false)
    expect(isValidCpf('123456789012')).toBe(false)
  })
  it('rejeita dígitos verificadores errados', () => {
    expect(isValidCpf('12345678900')).toBe(false)
  })
  it('rejeita sequências repetidas', () => {
    expect(isValidCpf('00000000000')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
  })
})

describe('formatCpf', () => {
  it('aplica a máscara', () => {
    expect(formatCpf('12345678909')).toBe('123.456.789-09')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/cpf'`.

- [ ] **Step 3: Implementar `lib/cpf.ts`**

```ts
/** Remove tudo que não é dígito. */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/** Valida CPF: 11 dígitos, não-sequência repetida, dígitos verificadores corretos. */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calcCheck = (slice: string, factorStart: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i], 10) * (factorStart - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const d1 = calcCheck(digits.slice(0, 9), 10)
  if (d1 !== parseInt(digits[9], 10)) return false
  const d2 = calcCheck(digits.slice(0, 10), 11)
  if (d2 !== parseInt(digits[10], 10)) return false
  return true
}

/** Aplica a máscara 000.000.000-00. */
export function formatCpf(cpf: string): string {
  const d = normalizeCpf(cpf)
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/cpf.ts lib/cpf.test.ts
git commit -m "feat: add CPF normalize/validate/format util"
```

---

## Task 4: Util PIX BR Code (`lib/pix.ts`)

**Files:**
- Create: `lib/pix.ts`
- Test: `lib/pix.test.ts`

**Interfaces:**
- Produces:
  - `crc16(payload: string): string` — 4 hex maiúsculos (CRC-16/CCITT-FALSE).
  - `buildPixPayload(p: { chave: string; nome: string; cidade: string; valorCentavos: number; txid: string }): string` — string "copia e cola" do PIX, com CRC final correto.

**Notas de implementação (padrão EMV / Pix do Banco Central):**
- Cada campo é `ID(2) + LEN(2, zero-padded) + VALUE`.
- Campo 26 (Merchant Account Information) é um template aninhado: subcampo `00 = "BR.GOV.BCB.PIX"`, subcampo `01 = chave`.
- Campos fixos: `00="01"`, `52="0000"` (MCC), `53="986"` (BRL), `54=valor` (ex. "150.00"), `58="BR"`, `59=nome` (≤25), `60=cidade` (≤15), `62` template com subcampo `05=txid` (alfanumérico, ≤25), `63=CRC`.
- O CRC é calculado sobre toda a string **incluindo** o prefixo `"6304"` do campo 63, e os 4 hex resultantes são anexados.
- Vetor de teste canônico do CRC-16/CCITT-FALSE: `crc16("123456789") === "29B1"`.

- [ ] **Step 1: Escrever o teste (failing)**

`lib/pix.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { crc16, buildPixPayload } from '@/lib/pix'

describe('crc16 (CCITT-FALSE)', () => {
  it('bate com o vetor canônico', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
  it('sempre retorna 4 hex maiúsculos', () => {
    expect(crc16('abc')).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe('buildPixPayload', () => {
  const base = {
    chave: 'recebedor@email.com',
    nome: 'SIMPOSIO AUDIOLOGIA',
    cidade: 'CASCAVEL',
    valorCentavos: 15000,
    txid: 'SIM-7K2Q',
  }

  it('começa com o payload format indicator e contém a GUI do Pix', () => {
    const p = buildPixPayload(base)
    expect(p.startsWith('000201')).toBe(true)
    expect(p).toContain('BR.GOV.BCB.PIX')
    expect(p).toContain('recebedor@email.com')
  })

  it('embute o valor formatado em 5303986 + 54', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('5303986')
    expect(p).toContain('5406150.00')
  })

  it('contém país, nome e cidade', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('5802BR')
    expect(p).toContain('5919SIMPOSIO AUDIOLOGIA') // 19 chars
    expect(p).toContain('6008CASCAVEL') // 08 chars
  })

  it('sanitiza o txid para alfanumérico no campo 62/05', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('62110507SIM7K2Q') // 62 len11 -> 05 len07 "SIM7K2Q"
  })

  it('termina com um CRC válido (round-trip)', () => {
    const p = buildPixPayload(base)
    const semCrc = p.slice(0, -4)
    const crcDado = p.slice(-4)
    expect(semCrc.endsWith('6304')).toBe(true)
    expect(crc16(semCrc)).toBe(crcDado)
  })

  it('trunca nome (≤25) e cidade (≤15)', () => {
    const p = buildPixPayload({
      ...base,
      nome: 'NOME MUITO LONGO QUE PASSA DE VINTE E CINCO',
      cidade: 'CIDADE COM NOME ENORME DEMAIS',
    })
    // round-trip continua válido mesmo truncado
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4))
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/pix'`.

- [ ] **Step 3: Implementar `lib/pix.ts`**

```ts
import { formatPixAmount } from '@/lib/money'

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF). Retorna 4 hex maiúsculos. */
export function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Monta um campo EMV: ID(2) + LEN(2) + VALUE. */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/** Remove acentos e mantém só caracteres ASCII imprimíveis seguros para o BR Code. */
function sanitizeText(text: string, maxLen: number): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, maxLen)
    .trim()
}

/** Monta o "PIX Copia e Cola" (BR Code estático com valor). */
export function buildPixPayload(p: {
  chave: string
  nome: string
  cidade: string
  valorCentavos: number
  txid: string
}): string {
  const merchantAccount =
    tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', p.chave)

  const txid = p.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const additionalData = tlv('05', txid)

  let payload =
    tlv('00', '01') + // payload format indicator
    tlv('26', merchantAccount) + // merchant account info (Pix)
    tlv('52', '0000') + // merchant category code
    tlv('53', '986') + // currency BRL
    tlv('54', formatPixAmount(p.valorCentavos)) + // amount
    tlv('58', 'BR') + // country
    tlv('59', sanitizeText(p.nome, 25)) + // merchant name
    tlv('60', sanitizeText(p.cidade, 15)) + // merchant city
    tlv('62', additionalData) // additional data (txid)

  payload += '6304' // campo CRC: ID(63) + LEN(04)
  return payload + crc16(payload)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS. Se o teste do `txid` (`62110507SIM7K2Q`) falhar por contagem de tamanho, confira: `additionalData = "0507SIM7K2Q"` (11 chars) → `tlv('62', ...)` = `"6211" + "0507SIM7K2Q"`. Os números batem.

- [ ] **Step 5: Commit**

```bash
git add lib/pix.ts lib/pix.test.ts
git commit -m "feat: add PIX BR Code (EMV) builder with CRC16-CCITT"
```

---

## Task 5: Seleção do lote vigente (`lib/lotes.ts`)

**Files:**
- Create: `lib/lotes.ts`
- Test: `lib/lotes.test.ts`

**Interfaces:**
- Consumes: tipo `Lote` de `@/lib/types`.
- Produces: `selectCurrentLote(lotes: Lote[], now: Date): Lote | null` — dentre os `ativo` cujo período cobre `now`, retorna o de menor `data_inicio`; senão `null`.

- [ ] **Step 1: Escrever o teste (failing)**

`lib/lotes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { selectCurrentLote } from '@/lib/lotes'
import type { Lote } from '@/lib/types'

const mk = (over: Partial<Lote>): Lote => ({
  id: Math.random().toString(36).slice(2),
  nome: 'Lote',
  preco_centavos: 10000,
  data_inicio: '2026-01-01T00:00:00Z',
  data_fim: '2026-12-31T23:59:59Z',
  ativo: true,
  ...over,
})

describe('selectCurrentLote', () => {
  const now = new Date('2026-08-01T12:00:00Z')

  it('retorna null quando não há lotes', () => {
    expect(selectCurrentLote([], now)).toBeNull()
  })

  it('retorna o lote cujo período cobre agora', () => {
    const lote = mk({ nome: 'Lote 2', data_inicio: '2026-07-01T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    expect(selectCurrentLote([lote], now)?.nome).toBe('Lote 2')
  })

  it('ignora lotes inativos', () => {
    const lote = mk({ nome: 'Inativo', ativo: false })
    expect(selectCurrentLote([lote], now)).toBeNull()
  })

  it('ignora lotes fora do período', () => {
    const passado = mk({ nome: 'Passado', data_inicio: '2026-01-01T00:00:00Z', data_fim: '2026-02-01T00:00:00Z' })
    const futuro = mk({ nome: 'Futuro', data_inicio: '2026-10-01T00:00:00Z', data_fim: '2026-11-01T00:00:00Z' })
    expect(selectCurrentLote([passado, futuro], now)).toBeNull()
  })

  it('com vários vigentes, escolhe o de menor data_inicio', () => {
    const a = mk({ nome: 'Cedo', data_inicio: '2026-07-01T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    const b = mk({ nome: 'Tarde', data_inicio: '2026-07-20T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    expect(selectCurrentLote([b, a], now)?.nome).toBe('Cedo')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/lotes'`.

- [ ] **Step 3: Implementar `lib/lotes.ts`**

```ts
import type { Lote } from '@/lib/types'

/**
 * Dentre os lotes ativos cujo período [data_inicio, data_fim] cobre `now`,
 * retorna o de menor data_inicio. Retorna null se nenhum estiver vigente.
 */
export function selectCurrentLote(lotes: Lote[], now: Date): Lote | null {
  const t = now.getTime()
  const vigentes = lotes.filter((l) => {
    if (!l.ativo) return false
    const ini = new Date(l.data_inicio).getTime()
    const fim = new Date(l.data_fim).getTime()
    return t >= ini && t <= fim
  })
  if (vigentes.length === 0) return null
  vigentes.sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  )
  return vigentes[0]
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/lotes.ts lib/lotes.test.ts
git commit -m "feat: add current-lote selection logic"
```

---

## Task 6: Geração de código de pedido (`lib/codigo.ts`)

**Files:**
- Create: `lib/codigo.ts`
- Test: `lib/codigo.test.ts`

**Interfaces:**
- Produces: `generateCodigo(): string` → `"SIM-XXXX"` com 4 chars de um alfabeto sem ambíguos (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).

- [ ] **Step 1: Escrever o teste (failing)**

`lib/codigo.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateCodigo, CODIGO_ALPHABET } from '@/lib/codigo'

describe('generateCodigo', () => {
  it('tem o formato SIM-XXXX', () => {
    expect(generateCodigo()).toMatch(/^SIM-[A-Z0-9]{4}$/)
  })
  it('usa apenas o alfabeto sem caracteres ambíguos', () => {
    const re = new RegExp(`^SIM-[${CODIGO_ALPHABET}]{4}$`)
    for (let i = 0; i < 200; i++) {
      expect(generateCodigo()).toMatch(re)
    }
  })
  it('não usa 0, O, 1, I', () => {
    expect(CODIGO_ALPHABET).not.toMatch(/[01OI]/)
  })
  it('gera valores variados (não é constante)', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateCodigo()))
    expect(set.size).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/codigo'`.

- [ ] **Step 3: Implementar `lib/codigo.ts`**

```ts
import { randomInt } from 'crypto'

/** Alfabeto sem caracteres ambíguos (sem 0/O/1/I). */
export const CODIGO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Gera um código de pedido não-enumerável: "SIM-XXXX". */
export function generateCodigo(): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += CODIGO_ALPHABET[randomInt(CODIGO_ALPHABET.length)]
  }
  return `SIM-${suffix}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/codigo.ts lib/codigo.test.ts
git commit -m "feat: add order code generator (non-enumerable)"
```

---

## Task 7: Auth do admin (`lib/auth.ts`)

**Files:**
- Create: `lib/auth.ts`
- Test: `lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `safeEqual(a: string, b: string): boolean` — comparação constant-time.
  - `signSession(secret: string, issuedAtMs?: number): string` — token `"<issuedAt>.<hmac>"`.
  - `verifySession(token: string, secret: string, maxAgeMs?: number): boolean`.
  - Constante `SESSION_COOKIE = 'simp_admin'`.

- [ ] **Step 1: Escrever o teste (failing)**

`lib/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { safeEqual, signSession, verifySession, SESSION_COOKIE } from '@/lib/auth'

describe('safeEqual', () => {
  it('true para iguais, false para diferentes', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})

describe('session HMAC', () => {
  const secret = 'super-secret-value'

  it('assina e verifica um token válido', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token, secret)).toBe(true)
  })

  it('rejeita token com secret errado', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token, 'outro-secret')).toBe(false)
  })

  it('rejeita token adulterado', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token + 'x', secret)).toBe(false)
    expect(verifySession('lixo', secret)).toBe(false)
  })

  it('rejeita token expirado', () => {
    const old = Date.now() - 1000 * 60 * 60 * 24 * 8 // 8 dias atrás
    const token = signSession(secret, old)
    expect(verifySession(token, secret, 1000 * 60 * 60 * 24 * 7)).toBe(false)
  })

  it('expõe o nome do cookie', () => {
    expect(SESSION_COOKIE).toBe('simp_admin')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/auth'`.

- [ ] **Step 3: Implementar `lib/auth.ts`**

```ts
import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'simp_admin'
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 dias

/** Comparação de strings em tempo constante. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function hmac(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

/** Cria um token de sessão "<issuedAtMs>.<hmac>". */
export function signSession(secret: string, issuedAtMs: number = Date.now()): string {
  const issued = String(issuedAtMs)
  return `${issued}.${hmac(secret, issued)}`
}

/** Verifica assinatura e validade do token. */
export function verifySession(
  token: string,
  secret: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [issued, sig] = parts
  const expected = hmac(secret, issued)
  if (!safeEqual(sig, expected)) return false
  const issuedMs = Number(issued)
  if (!Number.isFinite(issuedMs)) return false
  if (Date.now() - issuedMs > maxAgeMs) return false
  return true
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts lib/auth.test.ts
git commit -m "feat: add admin session HMAC + constant-time compare"
```

---

## Task 8: Serialização CSV (`lib/csv.ts`)

**Files:**
- Create: `lib/csv.ts`
- Test: `lib/csv.test.ts`

**Interfaces:**
- Produces: `toCsv(rows: (string | number)[][]): string` — escapa aspas/vírgulas/quebras, separa por `,`, linhas por `\r\n`, com BOM UTF-8 no início para o Excel.

- [ ] **Step 1: Escrever o teste (failing)**

`lib/csv.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('monta linhas separadas por CRLF com BOM', () => {
    const csv = toCsv([['a', 'b'], ['1', '2']])
    expect(csv).toBe('﻿a,b\r\n1,2')
  })
  it('escapa campos com vírgula, aspas e quebra de linha', () => {
    const csv = toCsv([['x,y', 'a"b', 'lin\nha']])
    expect(csv).toBe('﻿"x,y","a""b","lin\nha"')
  })
  it('converte números em texto', () => {
    const csv = toCsv([['nome', 42]])
    expect(csv).toBe('﻿nome,42')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/csv'`.

- [ ] **Step 3: Implementar `lib/csv.ts`**

```ts
function escapeField(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Serializa linhas em CSV (CRLF, BOM UTF-8 para Excel). */
export function toCsv(rows: (string | number)[][]): string {
  const body = rows.map((row) => row.map(escapeField).join(',')).join('\r\n')
  return '﻿' + body
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/csv.ts lib/csv.test.ts
git commit -m "feat: add CSV serializer with escaping and BOM"
```

---

## Task 9: Schema do banco (`supabase/schema.sql`)

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces (contrato de colunas que os route handlers consomem): tabelas `event_config` (1 linha, id=1), `lotes`, `pedidos`, `ingressos` exatamente com as colunas listadas na seção 3 do spec; buckets `evento-assets` (público) e `comprovantes` (privado).

> Esta task é aplicada manualmente no SQL Editor do Supabase (não há Postgres no CI). O deliverable versionado é o arquivo `.sql`; a verificação é uma query de checagem rodada no Supabase.

- [ ] **Step 1: Criar `supabase/schema.sql`**

```sql
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
  created_at       timestamptz not null default now()
);
create index if not exists idx_ingressos_pedido on ingressos(pedido_id);
create index if not exists idx_ingressos_cpf    on ingressos(cpf);

-- ---------- RLS: travar acesso anônimo (service role faz bypass) ----------
alter table event_config enable row level security;
alter table lotes        enable row level security;
alter table pedidos      enable row level security;
alter table ingressos    enable row level security;
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
```

- [ ] **Step 2: Aplicar no Supabase**

Abra o SQL Editor do projeto Supabase, cole o conteúdo de `supabase/schema.sql` e execute. Depois ajuste o seed real: edite a linha `event_config` (ou via painel admin depois) com a `pix_chave`, `pix_nome_recebedor` e `whatsapp_numero` verdadeiros.

- [ ] **Step 3: Verificar (query manual no Supabase)**

Rode no SQL Editor:
```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('event_config','lotes','pedidos','ingressos')
order by table_name;

select id, public from storage.buckets where id in ('evento-assets','comprovantes');

select count(*) as config_rows from event_config;
```
Expected: 4 tabelas listadas; 2 buckets (`comprovantes` public=false, `evento-assets` public=true); `config_rows = 1`.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema (event_config, lotes, pedidos, ingressos, buckets)"
```

---

## Task 10: Rate limiters + guard de admin + middleware

**Files:**
- Modify: `lib/ratelimit.ts` (novos limiters)
- Create: `lib/admin-guard.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `verifySession`, `SESSION_COOKIE` de `@/lib/auth`.
- Produces:
  - Em `lib/ratelimit.ts`: `inscricaoRatelimit`, `comprovanteRatelimit`, `lookupRatelimit`, `adminLoginRatelimit` (todos `Ratelimit` com `.limit(ip)`); `getClientIp` já existe.
  - Em `lib/admin-guard.ts`: `isRequestAdmin(req: NextRequest): boolean` e `isCookieAdmin(): Promise<boolean>` (para Server Components via `cookies()`).
  - `middleware.ts`: redireciona `/admin/*` (exceto `/admin/login`) sem cookie para `/admin/login`; retorna `401` em `/api/admin/*` sem cookie.

> **Modelo de segurança:** o middleware faz um **check de presença** do cookie (otimização de UX, roda no Edge). A **verificação real** (HMAC + validade) é feita server-side (Node) por `isRequestAdmin`/`isCookieAdmin` em cada route handler e Server Component admin. Um cookie forjado passa pelo middleware mas é rejeitado no handler/página.

- [ ] **Step 1: Estender `lib/ratelimit.ts`**

Adicione ao final de `lib/ratelimit.ts` (antes da função `getClientIp` ou após os limiters existentes):
```ts
// 5 inscrições por minuto por IP
export const inscricaoRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:inscricao',
})

// 5 uploads de comprovante por minuto por IP
export const comprovanteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:comprovante',
})

// 20 buscas "meus ingressos" por minuto por IP
export const lookupRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl:lookup',
})

// 5 tentativas de login admin por minuto por IP
export const adminLoginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:admin-login',
})
```

- [ ] **Step 2: Criar `lib/admin-guard.ts`**

```ts
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET env var')
  return secret
}

/** Verificação completa do cookie a partir de um NextRequest (route handlers). */
export function isRequestAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySession(token, getSecret())
}

/** Verificação completa via cookies() — para Server Components. */
export function isCookieAdmin(): boolean {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySession(token, getSecret())
}
```

- [ ] **Step 3: Criar `middleware.ts` (raiz do projeto)**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  // Permite a tela de login e o endpoint de login sem cookie (evita chicken-and-egg)
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  if (!hasCookie) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (pathname.startsWith('/admin')) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

- [ ] **Step 4: Verificar que o build/lint aceita os novos arquivos**

Run: `npm run lint`
Expected: sem erros nos arquivos novos (`lib/ratelimit.ts`, `lib/admin-guard.ts`, `middleware.ts`).

> Nota: `SESSION_COOKIE` é apenas uma string constante (sem `crypto`), então é seguro importá-la no `middleware.ts` (Edge). Não importe `verifySession` no middleware.

- [ ] **Step 5: Commit**

```bash
git add lib/ratelimit.ts lib/admin-guard.ts middleware.ts
git commit -m "feat: add rate limiters, admin guard and route-protection middleware"
```

---

## Task 11: Validação de inscrição + `POST /api/inscricao`

**Files:**
- Create: `lib/inscricao-validation.ts`
- Test: `lib/inscricao-validation.test.ts`
- Create: `app/api/inscricao/route.ts`

**Interfaces:**
- Consumes: `isValidCpf`, `normalizeCpf` (`@/lib/cpf`); `selectCurrentLote` (`@/lib/lotes`); `generateCodigo` (`@/lib/codigo`); `inscricaoRatelimit`, `getClientIp` (`@/lib/ratelimit`); `supabase` (`@/lib/supabase`); tipos (`@/lib/types`).
- Produces:
  - `validateInscricao(body: unknown): { ok: true; participantes: ParticipanteInput[] } | { ok: false; error: string }` — máx. 10 participantes; normaliza CPF e telefone.
  - `POST /api/inscricao` → `201 { codigo }` em sucesso; erros `400/403/409/429/500`.

- [ ] **Step 1: Escrever o teste do validador (failing)**

`lib/inscricao-validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateInscricao } from '@/lib/inscricao-validation'

const ok = {
  participantes: [
    { nome: 'Ana Souza', cpf: '529.982.247-25', data_nascimento: '1990-05-10', telefone: '(45) 99999-9999' },
  ],
}

describe('validateInscricao', () => {
  it('aceita um participante válido e normaliza cpf/telefone', () => {
    const r = validateInscricao(ok)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.participantes[0].cpf).toBe('52998224725')
      expect(r.participantes[0].telefone).toBe('45999999999')
    }
  })
  it('rejeita corpo sem participantes', () => {
    expect(validateInscricao({}).ok).toBe(false)
    expect(validateInscricao({ participantes: [] }).ok).toBe(false)
  })
  it('rejeita mais de 10 participantes', () => {
    const many = { participantes: Array.from({ length: 11 }, () => ok.participantes[0]) }
    expect(validateInscricao(many).ok).toBe(false)
  })
  it('rejeita nome curto', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], nome: 'A' }] })
    expect(r.ok).toBe(false)
  })
  it('rejeita CPF inválido', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], cpf: '12345678900' }] })
    expect(r.ok).toBe(false)
  })
  it('rejeita data de nascimento no futuro ou malformada', () => {
    expect(validateInscricao({ participantes: [{ ...ok.participantes[0], data_nascimento: '2999-01-01' }] }).ok).toBe(false)
    expect(validateInscricao({ participantes: [{ ...ok.participantes[0], data_nascimento: 'xx' }] }).ok).toBe(false)
  })
  it('rejeita telefone curto', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], telefone: '123' }] })
    expect(r.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/inscricao-validation'`.

- [ ] **Step 3: Implementar `lib/inscricao-validation.ts`**

```ts
import { isValidCpf, normalizeCpf } from '@/lib/cpf'
import type { ParticipanteInput } from '@/lib/types'

const MAX_PARTICIPANTES = 10

type Result =
  | { ok: true; participantes: ParticipanteInput[] }
  | { ok: false; error: string }

function isValidDateNascimento(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return false
  const year = d.getUTCFullYear()
  if (year < 1900) return false
  if (d.getTime() > Date.now()) return false
  return true
}

export function validateInscricao(body: unknown): Result {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Corpo inválido' }
  }
  const raw = (body as { participantes?: unknown }).participantes
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'Informe ao menos um participante' }
  }
  if (raw.length > MAX_PARTICIPANTES) {
    return { ok: false, error: `Máximo de ${MAX_PARTICIPANTES} ingressos por pedido` }
  }

  const participantes: ParticipanteInput[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: 'Participante inválido' }
    }
    const p = item as Record<string, unknown>
    const nome = typeof p.nome === 'string' ? p.nome.trim() : ''
    const cpf = typeof p.cpf === 'string' ? normalizeCpf(p.cpf) : ''
    const dataNasc = typeof p.data_nascimento === 'string' ? p.data_nascimento : ''
    const telefone = typeof p.telefone === 'string' ? p.telefone.replace(/\D/g, '') : ''

    if (nome.length < 2) return { ok: false, error: `Nome inválido para "${nome}"` }
    if (!isValidCpf(cpf)) return { ok: false, error: `CPF inválido: ${p.cpf}` }
    if (!isValidDateNascimento(dataNasc)) {
      return { ok: false, error: `Data de nascimento inválida para ${nome}` }
    }
    if (telefone.length < 10 || telefone.length > 13) {
      return { ok: false, error: `Telefone inválido para ${nome}` }
    }
    participantes.push({ nome, cpf, data_nascimento: dataNasc, telefone })
  }
  return { ok: true, participantes }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implementar `app/api/inscricao/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateInscricao } from '@/lib/inscricao-validation'
import { selectCurrentLote } from '@/lib/lotes'
import { generateCodigo } from '@/lib/codigo'
import { inscricaoRatelimit, getClientIp } from '@/lib/ratelimit'
import type { Lote } from '@/lib/types'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await inscricaoRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const validated = validateInscricao(body)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const { participantes } = validated

  // Config + inscrições abertas
  const { data: config, error: configErr } = await supabase
    .from('event_config')
    .select('capacidade, inscricoes_abertas')
    .eq('id', 1)
    .single()
  if (configErr || !config) {
    return NextResponse.json({ error: 'Configuração do evento não encontrada' }, { status: 500 })
  }
  if (!config.inscricoes_abertas) {
    return NextResponse.json({ error: 'As inscrições estão encerradas' }, { status: 403 })
  }

  // Lote vigente (server-side)
  const { data: lotes, error: lotesErr } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo')
  if (lotesErr) {
    return NextResponse.json({ error: 'Erro ao carregar lotes' }, { status: 500 })
  }
  const lote = selectCurrentLote((lotes ?? []) as Lote[], new Date())
  if (!lote) {
    return NextResponse.json({ error: 'Vendas não disponíveis no momento' }, { status: 403 })
  }

  // Capacidade (conta ingressos válidos de pedidos não cancelados)
  if (config.capacidade > 0) {
    const { count, error: countErr } = await supabase
      .from('ingressos')
      .select('id, pedidos!inner(status)', { count: 'exact', head: true })
      .eq('status', 'valido')
      .neq('pedidos.status', 'cancelado')
    if (countErr) {
      return NextResponse.json({ error: 'Erro ao verificar capacidade' }, { status: 500 })
    }
    if ((count ?? 0) + participantes.length > config.capacidade) {
      return NextResponse.json({ error: 'Ingressos esgotados' }, { status: 409 })
    }
  }

  const quantidade = participantes.length
  const precoUnit = lote.preco_centavos
  const valorTotal = precoUnit * quantidade
  const comprador = participantes[0]

  // Insere pedido com código único (retry em colisão)
  let pedidoId: string | null = null
  let codigo = ''
  for (let attempt = 0; attempt < 5 && !pedidoId; attempt++) {
    codigo = generateCodigo()
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        codigo,
        comprador_nome: comprador.nome,
        comprador_cpf: comprador.cpf,
        comprador_telefone: comprador.telefone,
        lote_id: lote.id,
        preco_unitario_centavos: precoUnit,
        quantidade,
        valor_total_centavos: valorTotal,
        status: 'pendente',
        metodo_comprovante: 'nenhum',
      })
      .select('id')
      .single()
    if (!error && data) {
      pedidoId = data.id
    } else if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
    }
  }
  if (!pedidoId) {
    return NextResponse.json({ error: 'Não foi possível gerar o pedido' }, { status: 500 })
  }

  // Insere ingressos
  const { error: ingressosErr } = await supabase.from('ingressos').insert(
    participantes.map((p) => ({
      pedido_id: pedidoId,
      nome: p.nome,
      cpf: p.cpf,
      data_nascimento: p.data_nascimento,
      telefone: p.telefone,
      status: 'valido',
    }))
  )
  if (ingressosErr) {
    // limpeza best-effort do pedido órfão
    await supabase.from('pedidos').delete().eq('id', pedidoId)
    return NextResponse.json({ error: 'Erro ao registrar ingressos' }, { status: 500 })
  }

  return NextResponse.json({ codigo }, { status: 201 })
}
```

> **Nota sobre concorrência:** o check de capacidade e o insert não são atômicos (pequeno risco de over-sell sob alta concorrência). Aceitável dado o volume do evento e a confirmação manual — a admin enxerga qualquer excedente no painel.

- [ ] **Step 6: Verificação manual**

Pré-requisito: ter pelo menos um lote vigente no Supabase (insira via `/admin/lotes` depois, ou um insert manual de teste). Com o dev server rodando (`npm run dev`):
```bash
curl -s -X POST http://localhost:3000/api/inscricao \
  -H 'Content-Type: application/json' \
  -d '{"participantes":[{"nome":"Ana Teste","cpf":"529.982.247-25","data_nascimento":"1990-05-10","telefone":"45999999999"}]}'
```
Expected: `{"codigo":"SIM-XXXX"}` com status 201. Conferir no Supabase que há 1 linha em `pedidos` (status `pendente`) e 1 em `ingressos`.

- [ ] **Step 7: Commit**

```bash
git add lib/inscricao-validation.ts lib/inscricao-validation.test.ts app/api/inscricao/route.ts
git commit -m "feat: add inscricao validation + POST /api/inscricao"
```

---

## Task 12: `POST /api/comprovante` (upload em bucket privado)

**Files:**
- Create: `app/api/comprovante/route.ts`

**Interfaces:**
- Consumes: `supabase` (`@/lib/supabase`); `comprovanteRatelimit`, `getClientIp` (`@/lib/ratelimit`).
- Produces: `POST /api/comprovante` (multipart: `codigo`, `file`) → `200 { ok: true }`; grava `comprovante_path` + `metodo_comprovante='upload'` no pedido. Bucket privado `comprovantes`.

- [ ] **Step 1: Implementar `app/api/comprovante/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { comprovanteRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_SIZE_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await comprovanteRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  const form = await request.formData()
  const codigo = form.get('codigo')
  const file = form.get('file') as File | null

  if (typeof codigo !== 'string' || !codigo) {
    return NextResponse.json({ error: 'Código do pedido ausente' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo inválido. Envie imagem ou PDF.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx. 8 MB)' }, { status: 400 })
  }

  // Pedido precisa existir e não estar cancelado
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, status')
    .eq('codigo', codigo)
    .single()
  if (pedidoErr || !pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (pedido.status === 'cancelado') {
    return NextResponse.json({ error: 'Pedido cancelado' }, { status: 409 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${codigo}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('comprovantes')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadErr) {
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('pedidos')
    .update({ comprovante_path: path, metodo_comprovante: 'upload' })
    .eq('id', pedido.id)
  if (updateErr) {
    return NextResponse.json({ error: 'Falha ao anexar comprovante' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verificação manual**

Com um `codigo` válido de um pedido criado na Task 11 e um arquivo `teste.png`:
```bash
curl -s -X POST http://localhost:3000/api/comprovante \
  -F 'codigo=SIM-XXXX' \
  -F 'file=@teste.png'
```
Expected: `{"ok":true}`. No Supabase, o pedido tem `comprovante_path` preenchido e `metodo_comprovante='upload'`; o arquivo aparece no bucket privado `comprovantes`.

- [ ] **Step 3: Commit**

```bash
git add app/api/comprovante/route.ts
git commit -m "feat: add POST /api/comprovante (private bucket upload)"
```

---

## Task 13: `POST /api/meus-ingressos` (busca por CPF)

**Files:**
- Create: `app/api/meus-ingressos/route.ts`

**Interfaces:**
- Consumes: `supabase`; `normalizeCpf`, `isValidCpf` (`@/lib/cpf`); `lookupRatelimit`, `getClientIp`.
- Produces: `POST /api/meus-ingressos` (`{ cpf }`) → `200 { pedidos: PedidoResumo[] }`, onde cada `PedidoResumo = { codigo, status, valor_total_centavos, quantidade, lote_nome, created_at, ingressos: { nome, status }[] }`. Retorna pedidos onde o CPF é do comprador **ou** de algum ingresso.

- [ ] **Step 1: Implementar `app/api/meus-ingressos/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeCpf, isValidCpf } from '@/lib/cpf'
import { lookupRatelimit, getClientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await lookupRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const cpfRaw = (body as { cpf?: unknown }).cpf
  const cpf = typeof cpfRaw === 'string' ? normalizeCpf(cpfRaw) : ''
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  // IDs de pedidos onde o CPF aparece em algum ingresso
  const { data: ingressoMatches } = await supabase
    .from('ingressos')
    .select('pedido_id')
    .eq('cpf', cpf)
  const pedidoIds = Array.from(new Set((ingressoMatches ?? []).map((r) => r.pedido_id)))

  // Pedidos do comprador OU com algum ingresso do CPF
  const orFilter = pedidoIds.length
    ? `comprador_cpf.eq.${cpf},id.in.(${pedidoIds.join(',')})`
    : `comprador_cpf.eq.${cpf}`

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(
      'codigo, status, valor_total_centavos, quantidade, created_at, lotes(nome), ingressos(nome, status)'
    )
    .or(orFilter)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }

  const result = (pedidos ?? []).map((p) => {
    const loteRel = p.lotes as unknown as { nome: string } | { nome: string }[] | null
    const loteNome = Array.isArray(loteRel) ? loteRel[0]?.nome : loteRel?.nome
    return {
      codigo: p.codigo,
      status: p.status,
      valor_total_centavos: p.valor_total_centavos,
      quantidade: p.quantidade,
      lote_nome: loteNome ?? '',
      created_at: p.created_at,
      ingressos: p.ingressos as { nome: string; status: string }[],
    }
  })

  return NextResponse.json({ pedidos: result })
}
```

- [ ] **Step 2: Verificação manual**

```bash
curl -s -X POST http://localhost:3000/api/meus-ingressos \
  -H 'Content-Type: application/json' \
  -d '{"cpf":"529.982.247-25"}'
```
Expected: `{"pedidos":[{"codigo":"SIM-XXXX","status":"pendente",...,"ingressos":[...]}]}` com o pedido criado na Task 11.

- [ ] **Step 3: Commit**

```bash
git add app/api/meus-ingressos/route.ts
git commit -m "feat: add POST /api/meus-ingressos (CPF lookup)"
```

---

## Task 14: Login/logout do admin

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/admin/logout/route.ts`

**Interfaces:**
- Consumes: `safeEqual`, `signSession`, `SESSION_COOKIE` (`@/lib/auth`); `adminLoginRatelimit`, `getClientIp`.
- Produces: `POST /api/admin/login` (`{ password }`) → `200 { ok: true }` + cookie de sessão; `POST /api/admin/logout` → limpa cookie. Env: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

- [ ] **Step 1: Implementar `app/api/admin/login/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { safeEqual, signSession, SESSION_COOKIE } from '@/lib/auth'
import { adminLoginRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 dias

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await adminLoginRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!adminPassword || !secret) {
    return NextResponse.json({ error: 'Servidor não configurado' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const password = (body as { password?: unknown }).password
  if (typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const token = signSession(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
  return res
}
```

- [ ] **Step 2: Implementar `app/api/admin/logout/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
```

- [ ] **Step 3: Verificação manual**

Defina `ADMIN_PASSWORD=teste123` e `ADMIN_SESSION_SECRET=qualquer-coisa-forte` em `.env.local`, reinicie o dev server.
```bash
curl -s -i -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' -d '{"password":"teste123"}' | grep -i set-cookie
curl -s -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' -d '{"password":"errada"}'
```
Expected: a 1ª retorna header `Set-Cookie: simp_admin=...`; a 2ª retorna `{"error":"Senha incorreta"}` (401).

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/login/route.ts app/api/admin/logout/route.ts
git commit -m "feat: add admin login/logout routes with HMAC session cookie"
```

---

## Task 15: Marcar pago/cancelar pedido + cancelar ingresso

**Files:**
- Create: `app/api/admin/pedidos/[id]/status/route.ts`
- Create: `app/api/admin/ingressos/[id]/cancel/route.ts`

**Interfaces:**
- Consumes: `supabase`; `isRequestAdmin` (`@/lib/admin-guard`).
- Produces:
  - `POST /api/admin/pedidos/[id]/status` (`{ status: 'pago'|'cancelado'|'pendente', observacao?: string }`) → atualiza `status`, seta/limpa `pago_em`, salva `observacao_admin`.
  - `POST /api/admin/ingressos/[id]/cancel` (`{ status: 'valido'|'cancelado' }`) → alterna status do ingresso.

- [ ] **Step 1: Implementar `app/api/admin/pedidos/[id]/status/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const VALID = ['pendente', 'pago', 'cancelado'] as const

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const status = (body as { status?: unknown }).status
  const observacao = (body as { observacao?: unknown }).observacao
  if (typeof status !== 'string' || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status,
    pago_em: status === 'pago' ? new Date().toISOString() : null,
  }
  if (typeof observacao === 'string') update.observacao_admin = observacao

  const { error } = await supabase.from('pedidos').update(update).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar pedido' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Implementar `app/api/admin/ingressos/[id]/cancel/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const status = (body as { status?: unknown }).status
  if (status !== 'valido' && status !== 'cancelado') {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  const { error } = await supabase.from('ingressos').update({ status }).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar ingresso' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Verificação manual**

Com o cookie de admin salvo (ex. `-b cookie.txt` após salvar o login com `-c cookie.txt`) e um id de pedido real:
```bash
curl -s -c cookie.txt -X POST http://localhost:3000/api/admin/login \
  -H 'Content-Type: application/json' -d '{"password":"teste123"}'
curl -s -b cookie.txt -X POST http://localhost:3000/api/admin/pedidos/<PEDIDO_ID>/status \
  -H 'Content-Type: application/json' -d '{"status":"pago"}'
```
Expected: `{"ok":true}`; no Supabase o pedido fica `status='pago'` com `pago_em` preenchido. Sem o cookie → `401`.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/pedidos app/api/admin/ingressos
git commit -m "feat: add admin routes to set order status and cancel tickets"
```

---

## Task 16: CRUD de lotes (admin)

**Files:**
- Create: `app/api/admin/lotes/route.ts`

**Interfaces:**
- Consumes: `supabase`; `isRequestAdmin`.
- Produces: `GET` lista lotes; `POST` cria (`{ nome, preco_centavos, data_inicio, data_fim }`); `PATCH` edita (`{ id, ...campos }`, inclui `ativo`); `DELETE` (`{ id }`) — bloqueia se houver pedidos vinculados (FK restrict → 409).

- [ ] **Step 1: Implementar `app/api/admin/lotes/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

function guard(request: NextRequest) {
  return isRequestAdmin(request)
}

export async function GET(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data, error } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo, created_at')
    .order('data_inicio', { ascending: true })
  if (error) return NextResponse.json({ error: 'Erro ao listar lotes' }, { status: 500 })
  return NextResponse.json({ lotes: data })
}

function parseLote(body: Record<string, unknown>) {
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const preco = Number(body.preco_centavos)
  const dataInicio = typeof body.data_inicio === 'string' ? body.data_inicio : ''
  const dataFim = typeof body.data_fim === 'string' ? body.data_fim : ''
  if (nome.length < 2) return { error: 'Nome do lote inválido' as const }
  if (!Number.isInteger(preco) || preco < 0) return { error: 'Preço inválido (use centavos)' as const }
  if (!dataInicio || !dataFim) return { error: 'Datas obrigatórias' as const }
  if (new Date(dataFim).getTime() < new Date(dataInicio).getTime()) {
    return { error: 'Data fim antes da data início' as const }
  }
  return { value: { nome, preco_centavos: preco, data_inicio: dataInicio, data_fim: dataFim } }
}

export async function POST(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = parseLote(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { data, error } = await supabase.from('lotes').insert({ ...parsed.value, ativo: true }).select().single()
  if (error) return NextResponse.json({ error: 'Erro ao criar lote' }, { status: 500 })
  return NextResponse.json({ lote: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const parsed = parseLote(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const update: Record<string, unknown> = { ...parsed.value }
  if (typeof body.ativo === 'boolean') update.ativo = body.ativo
  const { error } = await supabase.from('lotes').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao editar lote' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('lotes').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Lote tem pedidos vinculados. Desative em vez de excluir.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao excluir lote' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Verificação manual**

```bash
curl -s -b cookie.txt -X POST http://localhost:3000/api/admin/lotes \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Lote Promocional","preco_centavos":12000,"data_inicio":"2026-06-01T00:00:00-03:00","data_fim":"2026-08-31T23:59:59-03:00"}'
curl -s -b cookie.txt http://localhost:3000/api/admin/lotes
```
Expected: `201 {"lote":{...}}` e depois a lista contendo o lote criado. Esse lote serve de pré-requisito para a verificação da Task 11.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/lotes/route.ts
git commit -m "feat: add admin lotes CRUD route"
```

---

## Task 17: Config do evento + URL assinada do comprovante (admin)

**Files:**
- Create: `app/api/admin/config/route.ts`
- Create: `app/api/admin/comprovante/[pedidoId]/route.ts`

**Interfaces:**
- Consumes: `supabase`; `isRequestAdmin`.
- Produces:
  - `GET /api/admin/config` → `{ config }`; `PATCH` atualiza campos editáveis de `event_config`.
  - `GET /api/admin/comprovante/[pedidoId]` → `{ url }` (URL assinada de 60s do bucket privado) ou `404` se sem comprovante.

- [ ] **Step 1: Implementar `app/api/admin/config/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const EDITABLE = [
  'nome', 'subtitulo', 'data_inicio', 'data_fim', 'local', 'tags',
  'banner_url', 'pix_chave', 'pix_nome_recebedor', 'pix_cidade',
  'whatsapp_numero', 'capacidade', 'inscricoes_abertas',
] as const

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data, error } = await supabase.from('event_config').select('*').eq('id', 1).single()
  if (error) return NextResponse.json({ error: 'Erro ao ler config' }, { status: 500 })
  return NextResponse.json({ config: data })
}

export async function PATCH(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE) {
    if (key in body) {
      if (key === 'capacidade') {
        const n = Number(body[key])
        if (!Number.isInteger(n) || n < 0) {
          return NextResponse.json({ error: 'Capacidade inválida' }, { status: 400 })
        }
        update[key] = n
      } else if (key === 'inscricoes_abertas') {
        update[key] = Boolean(body[key])
      } else {
        update[key] = body[key]
      }
    }
  }
  const { error } = await supabase.from('event_config').update(update).eq('id', 1)
  if (error) return NextResponse.json({ error: 'Erro ao salvar config' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Implementar `app/api/admin/comprovante/[pedidoId]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

export async function GET(request: NextRequest, { params }: { params: { pedidoId: string } }) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('comprovante_path')
    .eq('id', params.pedidoId)
    .single()
  if (error || !pedido || !pedido.comprovante_path) {
    return NextResponse.json({ error: 'Sem comprovante' }, { status: 404 })
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from('comprovantes')
    .createSignedUrl(pedido.comprovante_path, 60)
  if (signErr || !signed) {
    return NextResponse.json({ error: 'Erro ao gerar link' }, { status: 500 })
  }
  return NextResponse.json({ url: signed.signedUrl })
}
```

- [ ] **Step 3: Verificação manual**

```bash
curl -s -b cookie.txt http://localhost:3000/api/admin/config
curl -s -b cookie.txt -X PATCH http://localhost:3000/api/admin/config \
  -H 'Content-Type: application/json' -d '{"capacidade":200}'
```
Expected: GET retorna `{"config":{...}}`; PATCH retorna `{"ok":true}` e `capacidade` vira 200 no Supabase. Para o comprovante, use o id de um pedido que teve upload na Task 12 → retorna `{"url":"https://...signed..."}`.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/config/route.ts app/api/admin/comprovante
git commit -m "feat: add admin config route and signed comprovante URL route"
```

---

## Task 18: Exportar CSV (admin)

**Files:**
- Create: `app/api/admin/export/route.ts`

**Interfaces:**
- Consumes: `supabase`; `isRequestAdmin`; `toCsv` (`@/lib/csv`); `formatBRL` (`@/lib/money`); `formatCpf` (`@/lib/cpf`).
- Produces: `GET /api/admin/export?tipo=participantes|pagamentos` → resposta `text/csv` com `Content-Disposition: attachment`.

- [ ] **Step 1: Implementar `app/api/admin/export/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'
import { toCsv } from '@/lib/csv'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const tipo = request.nextUrl.searchParams.get('tipo') ?? 'participantes'

  if (tipo === 'pagamentos') {
    const { data, error } = await supabase
      .from('pedidos')
      .select('codigo, comprador_nome, comprador_cpf, comprador_telefone, quantidade, valor_total_centavos, status, metodo_comprovante, pago_em, created_at')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
    const rows: (string | number)[][] = [
      ['Codigo', 'Comprador', 'CPF', 'Telefone', 'Qtd', 'Valor', 'Status', 'Comprovante', 'Pago em', 'Criado em'],
      ...(data ?? []).map((p) => [
        p.codigo, p.comprador_nome, formatCpf(p.comprador_cpf), p.comprador_telefone,
        p.quantidade, formatBRL(p.valor_total_centavos), p.status, p.metodo_comprovante,
        p.pago_em ?? '', p.created_at,
      ]),
    ]
    return csvResponse(toCsv(rows), 'pagamentos.csv')
  }

  // participantes (credenciamento) — ingressos válidos de pedidos pagos
  const { data, error } = await supabase
    .from('ingressos')
    .select('nome, cpf, data_nascimento, telefone, status, pedidos!inner(codigo, status)')
    .eq('status', 'valido')
    .eq('pedidos.status', 'pago')
    .order('nome', { ascending: true })
  if (error) return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  const rows: (string | number)[][] = [
    ['Nome', 'CPF', 'Nascimento', 'Telefone', 'Pedido'],
    ...(data ?? []).map((i) => {
      const pedidoRel = i.pedidos as unknown as { codigo: string } | { codigo: string }[]
      const codigo = Array.isArray(pedidoRel) ? pedidoRel[0]?.codigo : pedidoRel?.codigo
      return [i.nome, formatCpf(i.cpf), i.data_nascimento, i.telefone, codigo ?? '']
    }),
  ]
  return csvResponse(toCsv(rows), 'credenciamento.csv')
}

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 2: Verificação manual**

```bash
curl -s -b cookie.txt 'http://localhost:3000/api/admin/export?tipo=pagamentos' | head -5
curl -s -b cookie.txt 'http://localhost:3000/api/admin/export?tipo=participantes' | head -5
```
Expected: saída CSV com cabeçalho correto em cada caso (a 1ª linha pode começar com o BOM `﻿`).

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/export/route.ts
git commit -m "feat: add admin CSV export (payments + attendees)"
```

---

## Task 19: Acesso a dados (Server) + layout + landing `/`

**Files:**
- Create: `lib/event-data.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `components/event/Hero.tsx`
- Create: `components/event/TicketBox.tsx`
- Create: `app/page.tsx` (substitui o conteúdo atual de votação)

**Interfaces:**
- Consumes: `supabase`; `selectCurrentLote` (`@/lib/lotes`); `formatBRL` (`@/lib/money`); tipo `Lote`.
- Produces:
  - `EventConfig` (interface) e `getEventConfig(): Promise<EventConfig | null>`, `getLotes(): Promise<Lote[]>`, `getCurrentLote(): Promise<Lote | null>` em `@/lib/event-data` (somente servidor).
  - Componentes `Hero`, `TicketBox`. Landing renderizada em `/`.

- [ ] **Step 1: Criar `lib/event-data.ts`**

```ts
// SOMENTE SERVIDOR — importa o cliente service-role. Nunca usar em client components.
import { supabase } from '@/lib/supabase'
import { selectCurrentLote } from '@/lib/lotes'
import type { Lote } from '@/lib/types'

export interface EventConfig {
  id: number
  nome: string
  subtitulo: string | null
  data_inicio: string
  data_fim: string
  local: string | null
  tags: string | null
  banner_url: string | null
  pix_chave: string
  pix_nome_recebedor: string
  pix_cidade: string
  whatsapp_numero: string | null
  capacidade: number
  inscricoes_abertas: boolean
}

export async function getEventConfig(): Promise<EventConfig | null> {
  const { data } = await supabase.from('event_config').select('*').eq('id', 1).single()
  return (data as EventConfig) ?? null
}

export async function getLotes(): Promise<Lote[]> {
  const { data } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo')
  return (data as Lote[]) ?? []
}

export async function getCurrentLote(): Promise<Lote | null> {
  return selectCurrentLote(await getLotes(), new Date())
}
```

- [ ] **Step 2: Atualizar `app/layout.tsx` (metadata + tema)**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simpósio de Audiologia e Otoneurologia do Oeste do Paraná',
  description: 'Inscrições para o 1º Simpósio de Audiologia e Otoneurologia — Cascavel/PR, 20 e 21 de novembro de 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-simp-bg font-montserrat text-simp-ink">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Garantir o fundo do tema em `app/globals.css`**

Troque a regra `body { background-color: #f5f5f5; }` por:
```css
body {
  font-family: 'Montserrat', sans-serif;
  background-color: #F6F9FA;
}
```

- [ ] **Step 4: Criar `components/event/Hero.tsx`**

```tsx
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
```

- [ ] **Step 5: Criar `components/event/TicketBox.tsx`**

```tsx
import Link from 'next/link'
import { formatBRL } from '@/lib/money'

export function TicketBox({
  disponivel, loteNome, precoCentavos, inscricoesAbertas,
}: {
  disponivel: boolean
  loteNome: string | null
  precoCentavos: number | null
  inscricoesAbertas: boolean
}) {
  const indisponivel = !inscricoesAbertas || !disponivel || precoCentavos == null
  return (
    <div className="rounded-2xl border border-simp-mist bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-simp-deep">Ingresso</h2>
      {indisponivel ? (
        <p className="mt-4 rounded-lg bg-simp-mist px-4 py-3 text-sm font-semibold text-simp-deep">
          {inscricoesAbertas ? 'Vendas indisponíveis no momento.' : 'Inscrições encerradas.'}
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-simp-teal">{loteNome}</p>
              <p className="text-3xl font-extrabold text-simp-deep">{formatBRL(precoCentavos!)}</p>
            </div>
          </div>
          <Link
            href="/inscricao"
            className="mt-5 block rounded-full bg-simp-teal py-3 text-center font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep"
          >
            Comprar ingresso
          </Link>
        </>
      )}
      <Link href="/meus-ingressos" className="mt-4 block text-center text-sm font-semibold text-simp-teal underline">
        Já se inscreveu? Ver meus ingressos
      </Link>
    </div>
  )
}
```

- [ ] **Step 6: Criar `app/page.tsx` (landing, Server Component)**

```tsx
import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { Hero } from '@/components/event/Hero'
import { TicketBox } from '@/components/event/TicketBox'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config) {
    return <main className="mx-auto max-w-3xl px-5 py-20 text-center">Evento não configurado.</main>
  }

  return (
    <main>
      <Hero
        nome={config.nome}
        subtitulo={config.subtitulo}
        dataInicio={config.data_inicio}
        dataFim={config.data_fim}
        local={config.local}
        tags={config.tags}
        bannerUrl={config.banner_url}
      />
      <div className="mx-auto max-w-3xl px-5 py-10">
        <TicketBox
          disponivel={Boolean(lote)}
          loteNome={lote?.nome ?? null}
          precoCentavos={lote?.preco_centavos ?? null}
          inscricoesAbertas={config.inscricoes_abertas}
        />
        <section className="mt-10">
          <h2 className="text-xl font-bold text-simp-deep">Sobre o evento</h2>
          <p className="mt-3 text-simp-ink/80">
            Um encontro científico que conecta a audição, o equilíbrio e a vida. Dois dias de
            palestras e atualização em audiologia e otoneurologia em {config.local}.
          </p>
        </section>
      </div>
      <footer className="border-t border-simp-mist py-8 text-center text-sm text-simp-ink/60">
        {config.nome}
      </footer>
    </main>
  )
}
```

- [ ] **Step 7: Verificação manual**

Run: `npm run dev` e abra `http://localhost:3000`.
Expected: hero com gradiente teal, nome do evento, chip "📅 20 e 21 de novembro de 2026" e "📍 Cascavel, Paraná", e a caixa de ingresso mostrando o lote vigente + preço (ou "Vendas indisponíveis" se não houver lote). Confirme que não há mais conteúdo de votação na home.

- [ ] **Step 8: Commit**

```bash
git add lib/event-data.ts app/layout.tsx app/globals.css components/event app/page.tsx
git commit -m "feat: add event landing page, hero, ticket box and server data access"
```

---

## Task 20: Checkout `/inscricao`

**Files:**
- Create: `app/inscricao/page.tsx`
- Create: `components/checkout/CheckoutClient.tsx`

**Interfaces:**
- Consumes: `getEventConfig`, `getCurrentLote`; `formatBRL`; `POST /api/inscricao`.
- Produces: formulário multi-participante que cria o pedido e redireciona para `/pedido/[codigo]`. O 1º bloco é o comprador.

- [ ] **Step 1: Criar `app/inscricao/page.tsx` (Server Component)**

```tsx
import { redirect } from 'next/navigation'
import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { CheckoutClient } from '@/components/checkout/CheckoutClient'

export const dynamic = 'force-dynamic'

export default async function InscricaoPage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config || !config.inscricoes_abertas || !lote) {
    redirect('/')
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Inscrição</h1>
      <p className="mt-1 text-simp-ink/70">
        {config.nome}
      </p>
      <CheckoutClient loteNome={lote.nome} precoCentavos={lote.preco_centavos} />
    </main>
  )
}
```

- [ ] **Step 2: Criar `components/checkout/CheckoutClient.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'

interface Participante {
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
}

const vazio = (): Participante => ({ nome: '', cpf: '', data_nascimento: '', telefone: '' })

export function CheckoutClient({ loteNome, precoCentavos }: { loteNome: string; precoCentavos: number }) {
  const router = useRouter()
  const [participantes, setParticipantes] = useState<Participante[]>([vazio()])
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const total = useMemo(() => precoCentavos * participantes.length, [precoCentavos, participantes.length])

  function update(i: number, campo: keyof Participante, valor: string) {
    setParticipantes((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)))
  }
  function add() {
    setParticipantes((prev) => [...prev, vazio()])
  }
  function remove(i: number) {
    setParticipantes((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    setErro('')
    setEnviando(true)
    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao processar inscrição')
        setEnviando(false)
        return
      }
      router.push(`/pedido/${data.codigo}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <div className="mt-6">
      {participantes.map((p, i) => (
        <div key={i} className="mb-4 rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-simp-deep">
              {i === 0 ? 'Seu ingresso (seus dados)' : `Ingresso ${i + 1}`}
            </h2>
            {i > 0 && (
              <button type="button" onClick={() => remove(i)} className="text-sm font-semibold text-red-600">
                Remover
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Nome completo"
              value={p.nome} onChange={(e) => update(i, 'nome', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="CPF" inputMode="numeric"
              value={p.cpf} onChange={(e) => update(i, 'cpf', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" type="date" aria-label="Data de nascimento"
              value={p.data_nascimento} onChange={(e) => update(i, 'data_nascimento', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Telefone (WhatsApp)" inputMode="tel"
              value={p.telefone} onChange={(e) => update(i, 'telefone', e.target.value)} />
          </div>
        </div>
      ))}

      <button type="button" onClick={add}
        className="mb-6 w-full rounded-full border-2 border-dashed border-simp-teal py-3 font-semibold text-simp-teal">
        + Adicionar ingresso para outra pessoa
      </button>

      <div className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm text-simp-ink/70">
          <span>{loteNome} × {participantes.length}</span>
          <span>{formatBRL(precoCentavos)} cada</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-lg font-extrabold text-simp-deep">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
        {erro && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        <button type="button" onClick={submit} disabled={enviando}
          className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep disabled:opacity-60">
          {enviando ? 'Processando…' : 'Ir para pagamento'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificação manual**

Abra `http://localhost:3000/inscricao`. Preencha o 1º bloco (use um CPF válido, ex. `529.982.247-25`), adicione um 2º ingresso, confira que o total dobra, e clique "Ir para pagamento".
Expected: redireciona para `/pedido/SIM-XXXX`. Com CPF inválido, aparece a mensagem de erro vinda da API.

- [ ] **Step 4: Commit**

```bash
git add app/inscricao/page.tsx components/checkout/CheckoutClient.tsx
git commit -m "feat: add multi-ticket checkout page"
```

---

## Task 21: Tela de pagamento `/pedido/[codigo]`

**Files:**
- Modify: `package.json` (dep `qrcode` + `@types/qrcode`)
- Create: `lib/qr.ts`
- Create: `app/pedido/[codigo]/page.tsx`
- Create: `components/pagamento/PagamentoClient.tsx`

**Interfaces:**
- Consumes: `supabase`; `getEventConfig`; `buildPixPayload` (`@/lib/pix`); `formatBRL`; `POST /api/comprovante`.
- Produces: `qrDataUrl(payload: string): Promise<string>` em `@/lib/qr`; tela de pagamento com QR, copiar código, anexar comprovante, WhatsApp e status.

- [ ] **Step 1: Instalar `qrcode`**

Run:
```bash
npm install qrcode@^1.5.4
npm install -D @types/qrcode@^1.5.5
```

- [ ] **Step 2: Criar `lib/qr.ts`**

```ts
import QRCode from 'qrcode'

/** Gera um Data URL PNG do QR Code a partir do payload PIX. */
export async function qrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
}
```

- [ ] **Step 3: Criar `app/pedido/[codigo]/page.tsx` (Server Component)**

```tsx
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getEventConfig } from '@/lib/event-data'
import { buildPixPayload } from '@/lib/pix'
import { qrDataUrl } from '@/lib/qr'
import { formatBRL } from '@/lib/money'
import { PagamentoClient } from '@/components/pagamento/PagamentoClient'

export const dynamic = 'force-dynamic'

export default async function PedidoPage({ params }: { params: { codigo: string } }) {
  const config = await getEventConfig()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('codigo, comprador_nome, quantidade, valor_total_centavos, status, metodo_comprovante')
    .eq('codigo', params.codigo)
    .single()

  if (!pedido || !config) notFound()

  const pixPayload = buildPixPayload({
    chave: config.pix_chave,
    nome: config.pix_nome_recebedor,
    cidade: config.pix_cidade,
    valorCentavos: pedido.valor_total_centavos,
    txid: pedido.codigo,
  })
  const qr = await qrDataUrl(pixPayload)

  return (
    <main className="mx-auto max-w-xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Pagamento</h1>
      <p className="mt-1 text-simp-ink/70">
        Pedido <span className="font-bold">{pedido.codigo}</span> · {pedido.quantidade} ingresso(s)
      </p>

      <PagamentoClient
        codigo={pedido.codigo}
        status={pedido.status}
        valorFormatado={formatBRL(pedido.valor_total_centavos)}
        pixPayload={pixPayload}
        pixChave={config.pix_chave}
        qrDataUrl={qr}
        whatsappNumero={config.whatsapp_numero}
        jaTemComprovante={pedido.metodo_comprovante !== 'nenhum'}
      />
    </main>
  )
}
```

- [ ] **Step 4: Criar `components/pagamento/PagamentoClient.tsx`**

```tsx
'use client'

import { useState } from 'react'

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-amber-100 text-amber-800' },
  pago: { texto: 'Pagamento confirmado', classe: 'bg-green-100 text-green-800' },
  cancelado: { texto: 'Pedido cancelado', classe: 'bg-red-100 text-red-800' },
}

export function PagamentoClient({
  codigo, status, valorFormatado, pixPayload, pixChave, qrDataUrl, whatsappNumero, jaTemComprovante,
}: {
  codigo: string
  status: string
  valorFormatado: string
  pixPayload: string
  pixChave: string
  qrDataUrl: string
  whatsappNumero: string | null
  jaTemComprovante: boolean
}) {
  const [copiado, setCopiado] = useState(false)
  const [enviado, setEnviado] = useState(jaTemComprovante)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.pendente

  async function copiar() {
    await navigator.clipboard.writeText(pixPayload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function enviarComprovante(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('codigo', codigo)
      fd.append('file', file)
      const res = await fetch('/api/comprovante', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Falha ao enviar')
      } else {
        setEnviado(true)
      }
    } catch {
      setErro('Erro de conexão')
    }
    setEnviando(false)
  }

  const whatsappLink = whatsappNumero
    ? `https://wa.me/${whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Segue o comprovante de pagamento do pedido ${codigo}.`
      )}`
    : null

  return (
    <div className="mt-6 space-y-6">
      <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${badge.classe}`}>
        {badge.texto}
      </span>

      {status === 'pendente' && (
        <div className="rounded-2xl border border-simp-mist bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-simp-ink/70">Valor total</p>
          <p className="text-3xl font-extrabold text-simp-deep">{valorFormatado}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code PIX" className="mx-auto mt-4 h-64 w-64" />
          <button onClick={copiar}
            className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep">
            {copiado ? 'Código copiado!' : 'Copiar código PIX'}
          </button>
          <p className="mt-3 break-all rounded-lg bg-simp-mist px-3 py-2 text-xs text-simp-ink/70">
            Chave: {pixChave}
          </p>
        </div>
      )}

      {status === 'pendente' && (
        <div className="rounded-2xl border border-simp-mist bg-white p-6 shadow-sm">
          <h2 className="font-bold text-simp-deep">Enviar comprovante</h2>
          <p className="mt-1 text-sm text-simp-ink/70">
            Depois de pagar, anexe o comprovante aqui ou envie pelo WhatsApp.
          </p>
          {enviado ? (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Comprovante recebido! Em breve confirmaremos seu pagamento.
            </p>
          ) : (
            <label className="mt-4 block cursor-pointer rounded-full border-2 border-simp-teal py-3 text-center font-semibold text-simp-teal">
              {enviando ? 'Enviando…' : 'Anexar comprovante (imagem ou PDF)'}
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={enviarComprovante} disabled={enviando} />
            </label>
          )}
          {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="mt-3 block rounded-full bg-green-600 py-3 text-center font-semibold text-white">
              Enviar comprovante por WhatsApp
            </a>
          )}
        </div>
      )}

      {status === 'pago' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
          Pagamento confirmado! Seu(s) ingresso(s) está(ão) garantido(s). Guarde o código <b>{codigo}</b>.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verificação manual**

Abra `http://localhost:3000/pedido/SIM-XXXX` (código gerado na Task 20).
Expected: badge "Aguardando pagamento", valor total correto, QR Code renderizado, botão "Copiar código PIX" (copia o payload), chave PIX visível, área de anexar comprovante e botão WhatsApp. Anexe uma imagem → aparece "Comprovante recebido!". Para validar o QR, abra o app do banco e escaneie (deve reconhecer chave + valor).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/qr.ts app/pedido components/pagamento
git commit -m "feat: add PIX payment screen with QR, copy and proof upload"
```

---

## Task 22: `/meus-ingressos`

**Files:**
- Create: `app/meus-ingressos/page.tsx`
- Create: `components/ingressos/MeusIngressosClient.tsx`

**Interfaces:**
- Consumes: `POST /api/meus-ingressos`; `formatBRL`.
- Produces: tela com campo de CPF que lista pedidos/ingressos e status, com link para cada tela de pagamento.

- [ ] **Step 1: Criar `app/meus-ingressos/page.tsx`**

```tsx
import { MeusIngressosClient } from '@/components/ingressos/MeusIngressosClient'

export const metadata = { title: 'Meus ingressos' }

export default function MeusIngressosPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Meus ingressos</h1>
      <p className="mt-1 text-simp-ink/70">Digite seu CPF para ver suas inscrições.</p>
      <MeusIngressosClient />
    </main>
  )
}
```

- [ ] **Step 2: Criar `components/ingressos/MeusIngressosClient.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'

interface PedidoResumo {
  codigo: string
  status: string
  valor_total_centavos: number
  quantidade: number
  lote_nome: string
  created_at: string
  ingressos: { nome: string; status: string }[]
}

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-amber-100 text-amber-800' },
  pago: { texto: 'Pago', classe: 'bg-green-100 text-green-800' },
  cancelado: { texto: 'Cancelado', classe: 'bg-red-100 text-red-800' },
}

export function MeusIngressosClient() {
  const [cpf, setCpf] = useState('')
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function buscar() {
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch('/api/meus-ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro na busca')
        setPedidos(null)
      } else {
        setPedidos(data.pedidos)
      }
    } catch {
      setErro('Erro de conexão')
    }
    setCarregando(false)
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-simp-mist px-3 py-2" placeholder="Seu CPF"
          inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        <button onClick={buscar} disabled={carregando}
          className="rounded-full bg-simp-teal px-6 font-bold uppercase text-white disabled:opacity-60">
          {carregando ? '...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}

      {pedidos && pedidos.length === 0 && (
        <p className="mt-6 text-simp-ink/70">Nenhum pedido encontrado para este CPF.</p>
      )}

      <div className="mt-6 space-y-4">
        {pedidos?.map((p) => {
          const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.pendente
          return (
            <div key={p.codigo} className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-simp-deep">{p.codigo}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.classe}`}>{badge.texto}</span>
              </div>
              <p className="mt-1 text-sm text-simp-ink/70">
                {p.lote_nome} · {p.quantidade} ingresso(s) · {formatBRL(p.valor_total_centavos)}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {p.ingressos.map((ing, idx) => (
                  <li key={idx} className={ing.status === 'cancelado' ? 'text-red-600 line-through' : 'text-simp-ink'}>
                    {ing.nome} {ing.status === 'cancelado' && '(cancelado)'}
                  </li>
                ))}
              </ul>
              {p.status === 'pendente' && (
                <Link href={`/pedido/${p.codigo}`} className="mt-3 inline-block text-sm font-semibold text-simp-teal underline">
                  Ver pagamento →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificação manual**

Abra `http://localhost:3000/meus-ingressos`, digite o CPF usado na Task 20 e clique "Buscar".
Expected: lista o pedido criado, com status "Aguardando pagamento", nomes dos participantes e link "Ver pagamento →". CPF sem pedidos → "Nenhum pedido encontrado".

- [ ] **Step 4: Commit**

```bash
git add app/meus-ingressos components/ingressos
git commit -m "feat: add meus-ingressos lookup page"
```

---

## Task 23: Login admin + Dashboard

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `components/admin/LoginClient.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/PedidosTable.tsx`

**Interfaces:**
- Consumes: `isCookieAdmin` (`@/lib/admin-guard`); `getEventConfig`; `supabase`; `formatBRL`, `formatCpf`; rotas admin de status/cancel/comprovante/export.
- Produces: tela de login; dashboard com cards de métricas + tabela de pedidos com filtros e ações.

- [ ] **Step 1: Criar `app/admin/login/page.tsx`**

```tsx
import { LoginClient } from '@/components/admin/LoginClient'

export const metadata = { title: 'Admin — Login' }

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="text-2xl font-extrabold text-simp-deep">Painel administrativo</h1>
      <p className="mt-1 text-simp-ink/70">Acesso restrito.</p>
      <LoginClient />
    </main>
  )
}
```

- [ ] **Step 2: Criar `components/admin/LoginClient.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar() {
    setErro('')
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? 'Erro')
        setEnviando(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setErro('Erro de conexão')
      setEnviando(false)
    }
  }

  return (
    <div className="mt-6">
      <input type="password" className="w-full rounded-lg border border-simp-mist px-3 py-2"
        placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && entrar()} />
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
      <button onClick={entrar} disabled={enviando}
        className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase text-white disabled:opacity-60">
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Criar `app/admin/page.tsx` (Server Component com métricas)**

```tsx
import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { supabase } from '@/lib/supabase'
import { formatBRL } from '@/lib/money'
import { PedidosTable, type PedidoRow } from '@/components/admin/PedidosTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  if (!isCookieAdmin()) redirect('/admin/login')

  const config = await getEventConfig()
  const { data: pedidosData } = await supabase
    .from('pedidos')
    .select(
      'id, codigo, comprador_nome, comprador_cpf, comprador_telefone, quantidade, valor_total_centavos, status, metodo_comprovante, comprovante_path, observacao_admin, created_at, lotes(nome), ingressos(id, nome, cpf, status)'
    )
    .order('created_at', { ascending: false })

  const pedidos: PedidoRow[] = (pedidosData ?? []).map((p) => {
    const loteRel = p.lotes as unknown as { nome: string } | { nome: string }[] | null
    const loteNome = Array.isArray(loteRel) ? loteRel[0]?.nome : loteRel?.nome
    return {
      id: p.id,
      codigo: p.codigo,
      comprador_nome: p.comprador_nome,
      comprador_cpf: p.comprador_cpf,
      comprador_telefone: p.comprador_telefone,
      quantidade: p.quantidade,
      valor_total_centavos: p.valor_total_centavos,
      status: p.status,
      metodo_comprovante: p.metodo_comprovante,
      tem_comprovante: Boolean(p.comprovante_path),
      observacao_admin: p.observacao_admin,
      lote_nome: loteNome ?? '',
      ingressos: p.ingressos as PedidoRow['ingressos'],
    }
  })

  // Métricas
  const inscritos = pedidos
    .filter((p) => p.status !== 'cancelado')
    .reduce((acc, p) => acc + p.ingressos.filter((i) => i.status === 'valido').length, 0)
  const pagos = pedidos.filter((p) => p.status === 'pago')
  const pendentes = pedidos.filter((p) => p.status === 'pendente')
  const cancelados = pedidos.filter((p) => p.status === 'cancelado')
  const receitaConfirmada = pagos.reduce((a, p) => a + p.valor_total_centavos, 0)
  const receitaPendente = pendentes.reduce((a, p) => a + p.valor_total_centavos, 0)
  const capacidade = config?.capacidade ?? 0

  const cards = [
    { label: 'Inscritos (válidos)', valor: String(inscritos) },
    { label: 'Pedidos pagos', valor: String(pagos.length) },
    { label: 'Pendentes', valor: String(pendentes.length) },
    { label: 'Cancelados', valor: String(cancelados.length) },
    { label: 'Receita confirmada', valor: formatBRL(receitaConfirmada) },
    { label: 'Receita pendente', valor: formatBRL(receitaPendente) },
    { label: 'Capacidade', valor: capacidade > 0 ? `${inscritos}/${capacidade}` : 'Ilimitada' },
  ]

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-simp-deep">Dashboard</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/lotes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">Lotes</Link>
          <Link href="/admin/configuracoes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">Configurações</Link>
          <a href="/api/admin/export?tipo=participantes" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">CSV credenciamento</a>
          <a href="/api/admin/export?tipo=pagamentos" className="rounded-full border border-simp-teal px-4 py-2 font-semibold text-simp-teal">CSV pagamentos</a>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-full bg-simp-deep px-4 py-2 font-semibold text-white">Sair</button>
          </form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-simp-mist bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-simp-ink/60">{c.label}</p>
            <p className="mt-1 text-xl font-extrabold text-simp-deep">{c.valor}</p>
          </div>
        ))}
      </div>

      <PedidosTable pedidos={pedidos} />
    </main>
  )
}
```

> Nota: o `<form action="/api/admin/logout" method="post">` faz um POST nativo; o handler limpa o cookie e o navegador é redirecionado pelo middleware na próxima navegação. Para garantir o retorno ao login, a tabela usa `router.refresh()` após ações; o logout pode também ser feito via fetch + `router.push('/admin/login')` se preferir — manter o form simples é suficiente.

- [ ] **Step 4: Criar `components/admin/PedidosTable.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'

export interface PedidoRow {
  id: string
  codigo: string
  comprador_nome: string
  comprador_cpf: string
  comprador_telefone: string
  quantidade: number
  valor_total_centavos: number
  status: string
  metodo_comprovante: string
  tem_comprovante: boolean
  observacao_admin: string | null
  lote_nome: string
  ingressos: { id: string; nome: string; cpf: string; status: string }[]
}

const STATUS_CLASSE: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export function PedidosTable({ pedidos }: { pedidos: PedidoRow[] }) {
  const router = useRouter()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
      if (!q) return true
      return (
        p.codigo.toLowerCase().includes(q) ||
        p.comprador_nome.toLowerCase().includes(q) ||
        p.comprador_cpf.includes(q.replace(/\D/g, ''))
      )
    })
  }, [pedidos, filtroStatus, busca])

  async function setStatus(id: string, status: string) {
    if (status === 'cancelado' && !confirm('Cancelar este pedido?')) return
    setOcupado(true)
    await fetch(`/api/admin/pedidos/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOcupado(false)
    router.refresh()
  }

  async function cancelarIngresso(id: string, atual: string) {
    const novo = atual === 'cancelado' ? 'valido' : 'cancelado'
    setOcupado(true)
    await fetch(`/api/admin/ingressos/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo }),
    })
    setOcupado(false)
    router.refresh()
  }

  async function verComprovante(pedidoId: string) {
    const res = await fetch(`/api/admin/comprovante/${pedidoId}`)
    const data = await res.json()
    if (res.ok && data.url) window.open(data.url, '_blank')
    else alert(data.error ?? 'Sem comprovante')
  }

  function whatsapp(p: PedidoRow) {
    const num = p.comprador_telefone.replace(/\D/g, '')
    const texto = encodeURIComponent(`Olá ${p.comprador_nome}! Sobre sua inscrição ${p.codigo} no Simpósio.`)
    window.open(`https://wa.me/55${num}?text=${texto}`, '_blank')
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-simp-mist px-3 py-2 text-sm">
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, CPF ou código"
          className="flex-1 rounded-lg border border-simp-mist px-3 py-2 text-sm" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-simp-mist text-left text-simp-ink/60">
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Comprador</th>
              <th className="py-2 pr-3">Telefone</th>
              <th className="py-2 pr-3">Qtd</th>
              <th className="py-2 pr-3">Lote</th>
              <th className="py-2 pr-3">Valor</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <>
                <tr key={p.id} className="border-b border-simp-mist/60 align-top">
                  <td className="py-3 pr-3 font-bold text-simp-deep">
                    <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} className="underline">
                      {p.codigo}
                    </button>
                  </td>
                  <td className="py-3 pr-3">{p.comprador_nome}<br /><span className="text-xs text-simp-ink/60">{formatCpf(p.comprador_cpf)}</span></td>
                  <td className="py-3 pr-3">{p.comprador_telefone}</td>
                  <td className="py-3 pr-3">{p.quantidade}</td>
                  <td className="py-3 pr-3">{p.lote_nome}</td>
                  <td className="py-3 pr-3">{formatBRL(p.valor_total_centavos)}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSE[p.status] ?? ''}`}>{p.status}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {p.status !== 'pago' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'pago')}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">Marcar pago</button>
                      )}
                      {p.status !== 'cancelado' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'cancelado')}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">Cancelar</button>
                      )}
                      {p.status === 'cancelado' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'pendente')}
                          className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white">Reabrir</button>
                      )}
                      {p.tem_comprovante && (
                        <button onClick={() => verComprovante(p.id)}
                          className="rounded bg-simp-teal px-2 py-1 text-xs font-semibold text-white">Comprovante</button>
                      )}
                      <button onClick={() => whatsapp(p)}
                        className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">WhatsApp</button>
                    </div>
                  </td>
                </tr>
                {expandido === p.id && (
                  <tr className="border-b border-simp-mist/60 bg-simp-mist/30">
                    <td colSpan={8} className="px-3 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-simp-ink/60">Participantes</p>
                      <ul className="space-y-1">
                        {p.ingressos.map((ing) => (
                          <li key={ing.id} className="flex items-center justify-between">
                            <span className={ing.status === 'cancelado' ? 'text-red-600 line-through' : ''}>
                              {ing.nome} — {formatCpf(ing.cpf)}
                            </span>
                            <button disabled={ocupado} onClick={() => cancelarIngresso(ing.id, ing.status)}
                              className="text-xs font-semibold text-simp-teal underline">
                              {ing.status === 'cancelado' ? 'Reativar' : 'Cancelar ingresso'}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {p.observacao_admin && (
                        <p className="mt-2 text-xs text-simp-ink/70">Obs.: {p.observacao_admin}</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="py-6 text-center text-simp-ink/60">Nenhum pedido.</p>}
      </div>
    </div>
  )
}
```

> Nota React: as linhas usam `<>...</>` dentro do `map`. Como o fragmento precisa de `key`, troque `<>` por `<Fragment key={p.id}>` importando `Fragment` de `react` e removendo os `key` internos. Ajuste ao implementar: `import { Fragment, useMemo, useState } from 'react'` e envolva cada par de linhas em `<Fragment key={p.id}>`.

- [ ] **Step 5: Verificação manual**

Abra `http://localhost:3000/admin` (sem cookie → redireciona para `/admin/login`). Faça login com a `ADMIN_PASSWORD`. 
Expected: dashboard com os 7 cards, a tabela listando o pedido de teste. Teste: "Marcar pago" muda o status e a receita confirmada sobe; expandir o código mostra participantes; "Comprovante" abre o arquivo (se enviado); filtros e busca funcionam.

- [ ] **Step 6: Commit**

```bash
git add app/admin/login app/admin/page.tsx components/admin/LoginClient.tsx components/admin/PedidosTable.tsx
git commit -m "feat: add admin login and dashboard with orders table"
```

---

## Task 24: Gerenciar lotes `/admin/lotes`

**Files:**
- Create: `app/admin/lotes/page.tsx`
- Create: `components/admin/LotesManager.tsx`

**Interfaces:**
- Consumes: `isCookieAdmin`; `getLotes`; rota `/api/admin/lotes` (GET/POST/PATCH/DELETE).
- Produces: tela CRUD de lotes (preço em reais na UI, convertido para centavos no envio).

- [ ] **Step 1: Criar `app/admin/lotes/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getLotes } from '@/lib/event-data'
import { LotesManager } from '@/components/admin/LotesManager'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LotesPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const lotes = await getLotes()
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin" className="text-sm font-semibold text-simp-teal">← Voltar ao dashboard</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-simp-deep">Lotes</h1>
      <LotesManager lotesIniciais={lotes} />
    </main>
  )
}
```

- [ ] **Step 2: Criar `components/admin/LotesManager.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import type { Lote } from '@/lib/types'

// Converte "150,00" ou "150.00" em centavos (15000)
function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(limpo) * 100)
}
// "2026-08-31T23:59:59-03:00" -> "2026-08-31T23:59" para o input datetime-local
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LotesManager({ lotesIniciais }: { lotesIniciais: Lote[] }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')

  async function criar() {
    setErro('')
    const centavos = reaisParaCentavos(preco)
    if (!Number.isFinite(centavos) || centavos < 0) {
      setErro('Preço inválido')
      return
    }
    const res = await fetch('/api/admin/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        preco_centavos: centavos,
        data_inicio: new Date(inicio).toISOString(),
        data_fim: new Date(fim).toISOString(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErro(data.error ?? 'Erro')
      return
    }
    setNome(''); setPreco(''); setInicio(''); setFim('')
    router.refresh()
  }

  async function toggleAtivo(lote: Lote) {
    await fetch('/api/admin/lotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lote.id, nome: lote.nome, preco_centavos: lote.preco_centavos,
        data_inicio: lote.data_inicio, data_fim: lote.data_fim, ativo: !lote.ativo,
      }),
    })
    router.refresh()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este lote?')) return
    const res = await fetch('/api/admin/lotes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Erro ao excluir')
      return
    }
    router.refresh()
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
        <h2 className="font-bold text-simp-deep">Novo lote</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Nome (ex.: Lote Promocional)"
            value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Preço (ex.: 150,00)"
            value={preco} onChange={(e) => setPreco(e.target.value)} />
          <label className="text-sm text-simp-ink/70">Início
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2"
              value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="text-sm text-simp-ink/70">Fim
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2"
              value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>
        {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
        <button onClick={criar} className="mt-4 rounded-full bg-simp-teal px-6 py-2 font-bold uppercase text-white">
          Criar lote
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {lotesIniciais.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-simp-mist bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-simp-deep">{l.nome} — {formatBRL(l.preco_centavos)}</p>
              <p className="text-xs text-simp-ink/60">
                {new Date(l.data_inicio).toLocaleString('pt-BR')} → {new Date(l.data_fim).toLocaleString('pt-BR')}
              </p>
              <span className={`text-xs font-semibold ${l.ativo ? 'text-green-700' : 'text-simp-ink/50'}`}>
                {l.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAtivo(l)} className="rounded-full border border-simp-teal px-3 py-1 text-sm font-semibold text-simp-teal">
                {l.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => excluir(l.id)} className="rounded-full border border-red-500 px-3 py-1 text-sm font-semibold text-red-600">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {lotesIniciais.length === 0 && <p className="text-simp-ink/60">Nenhum lote cadastrado.</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificação manual**

Em `http://localhost:3000/admin/lotes` (logado), crie um lote com período cobrindo hoje e preço `150,00`.
Expected: o lote aparece na lista como "Ativo"; voltando à home `/`, a caixa de ingresso passa a mostrar esse lote/preço. Desativar/excluir reflete na lista (excluir com pedidos vinculados → alerta de erro).

- [ ] **Step 4: Commit**

```bash
git add app/admin/lotes components/admin/LotesManager.tsx
git commit -m "feat: add admin lotes management page"
```

---

## Task 25: Configurações do evento `/admin/configuracoes`

**Files:**
- Create: `app/admin/configuracoes/page.tsx`
- Create: `components/admin/ConfigForm.tsx`

**Interfaces:**
- Consumes: `isCookieAdmin`; `getEventConfig`; rota `PATCH /api/admin/config`.
- Produces: formulário de edição do `event_config`.

- [ ] **Step 1: Criar `app/admin/configuracoes/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { ConfigForm } from '@/components/admin/ConfigForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const config = await getEventConfig()
  if (!config) return <main className="p-8">Configuração não encontrada.</main>
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin" className="text-sm font-semibold text-simp-teal">← Voltar ao dashboard</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-simp-deep">Configurações do evento</h1>
      <ConfigForm config={config} />
    </main>
  )
}
```

- [ ] **Step 2: Criar `components/admin/ConfigForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventConfig } from '@/lib/event-data'

const CAMPOS_TEXTO: { key: keyof EventConfig; label: string }[] = [
  { key: 'nome', label: 'Nome do evento' },
  { key: 'subtitulo', label: 'Subtítulo' },
  { key: 'local', label: 'Local' },
  { key: 'tags', label: 'Faixa de tags' },
  { key: 'banner_url', label: 'URL do banner' },
  { key: 'pix_chave', label: 'Chave PIX' },
  { key: 'pix_nome_recebedor', label: 'Nome do recebedor (PIX, ≤25)' },
  { key: 'pix_cidade', label: 'Cidade do recebedor (PIX, ≤15)' },
  { key: 'whatsapp_numero', label: 'WhatsApp (ex.: 5545999999999)' },
]

export function ConfigForm({ config }: { config: EventConfig }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string | number | boolean>>({ ...config })
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)

  function set(key: string, valor: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: valor }))
  }

  async function salvar() {
    setMsg('')
    setSalvando(true)
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setMsg(res.ok ? 'Salvo!' : (data.error ?? 'Erro'))
    setSalvando(false)
    if (res.ok) router.refresh()
  }

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
      {CAMPOS_TEXTO.map((c) => (
        <label key={c.key} className="block text-sm font-semibold text-simp-ink/80">
          {c.label}
          <input className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            value={String(form[c.key] ?? '')} onChange={(e) => set(c.key, e.target.value)} />
        </label>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-simp-ink/80">Início
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            defaultValue={localInput(config.data_inicio)}
            onChange={(e) => set('data_inicio', new Date(e.target.value).toISOString())} />
        </label>
        <label className="block text-sm font-semibold text-simp-ink/80">Fim
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            defaultValue={localInput(config.data_fim)}
            onChange={(e) => set('data_fim', new Date(e.target.value).toISOString())} />
        </label>
      </div>

      <label className="block text-sm font-semibold text-simp-ink/80">Capacidade (0 = ilimitada)
        <input type="number" min={0} className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
          value={Number(form.capacidade ?? 0)} onChange={(e) => set('capacidade', Number(e.target.value))} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-simp-ink/80">
        <input type="checkbox" checked={Boolean(form.inscricoes_abertas)}
          onChange={(e) => set('inscricoes_abertas', e.target.checked)} />
        Inscrições abertas
      </label>

      {msg && <p className="text-sm font-semibold text-simp-teal">{msg}</p>}
      <button onClick={salvar} disabled={salvando}
        className="rounded-full bg-simp-teal px-6 py-2 font-bold uppercase text-white disabled:opacity-60">
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}

function localInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
```

- [ ] **Step 3: Verificação manual**

Em `http://localhost:3000/admin/configuracoes` (logado), altere a `Chave PIX` e o `WhatsApp`, salve.
Expected: "Salvo!" aparece; a tela de pagamento `/pedido/[codigo]` passa a usar a nova chave (no QR/copia-e-cola) e o botão de WhatsApp aponta para o novo número. Desmarcar "Inscrições abertas" faz `/inscricao` redirecionar para a home.

- [ ] **Step 4: Commit**

```bash
git add app/admin/configuracoes components/admin/ConfigForm.tsx
git commit -m "feat: add admin event configuration page"
```

---

## Task 26: Limpeza do código de votação + docs + verificação final

**Files:**
- Delete: `app/votar/`, `app/candidatos/`, `app/api/votos/`, `app/api/candidatos/`, `app/api/config/`, `app/api/upload/`, `components/votar/`, `components/candidatos/`, `lib/normalize.ts`
- Modify: `lib/ratelimit.ts` (remover limiters de votação não usados)
- Modify: `tailwind.config.ts` (remover paleta `puc`)
- Create: `.env.local.example`
- Create/Modify: `README.md`

**Interfaces:**
- Produces: repositório sem código de votação; `npm test`, `npm run lint` e `npm run build` passando.

- [ ] **Step 1: Remover rotas e componentes de votação**

```bash
git rm -r app/votar app/candidatos app/api/votos app/api/candidatos app/api/config app/api/upload components/votar components/candidatos lib/normalize.ts
```

- [ ] **Step 2: Limpar limiters não usados em `lib/ratelimit.ts`**

Remova os exports `votosRatelimit`, `candidatosRatelimit` e `uploadRatelimit` (eram do sistema de votação). Mantenha `redis`, `getClientIp`, `inscricaoRatelimit`, `comprovanteRatelimit`, `lookupRatelimit`, `adminLoginRatelimit`.

- [ ] **Step 3: Remover a paleta `puc` de `tailwind.config.ts`**

Em `theme.extend.colors`, apague o bloco `puc: { ... }`. Mantenha `simp`, `fontFamily`, `maxWidth`, `keyframes`, `animation`.

- [ ] **Step 4: Criar `.env.local.example`**

```env
# Supabase (servidor — nunca exponha ao cliente)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=

# Upstash (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 5: Criar/atualizar `README.md`**

```markdown
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
```

- [ ] **Step 6: Verificação — testes**

Run: `npm test`
Expected: PASS em todos os arquivos `lib/*.test.ts` (money, cpf, pix, lotes, codigo, auth, csv, types, inscricao-validation).

- [ ] **Step 7: Verificação — lint**

Run: `npm run lint`
Expected: sem erros. Se aparecer aviso sobre `<img>` (`@next/next/no-img-element`), já há `eslint-disable-next-line` nos pontos relevantes; trate quaisquer erros remanescentes.

- [ ] **Step 8: Verificação — build**

Run: `npm run build`
Expected: build conclui sem erros de tipo. Páginas dinâmicas (`force-dynamic`) e rotas de API compilam.

> Se o build falhar em variáveis de ambiente ausentes durante a coleta de dados de páginas, garanta `.env.local` preenchido (build do Next executa Server Components que tocam o Supabase). Alternativamente, as páginas usam `dynamic = 'force-dynamic'` para evitar pré-render estático.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove voting code, add env example, README and finalize"
```

---

## Self-Review (executado pelo autor do plano)

**1. Cobertura do spec:**
- §2 modelo de dados → Task 9 (schema), Tasks 11–18 (uso).
- §4 PIX → Task 4 (BR Code), Task 21 (QR + copiar + comprovante + WhatsApp).
- §5 dashboard → Task 23 (cards + tabela + ações + export), Task 18 (CSV).
- §6 segurança → Tasks 7, 10, 14 (auth/middleware/guard), buckets privados Task 9/17, rate limit Task 10.
- §6 regras de negócio (multi-ingresso, preço server-side, capacidade, inscrições abertas) → Task 11.
- §10 visual Sympla → Tasks 1 (tema), 19 (landing/hero/ticketbox), 20–22.
- §11 fora de escopo respeitado (sem e-mail, sem gateway, sem categorias).

**2. Placeholders:** nenhum "TBD/TODO"; todo passo de código tem código completo. Vetores de teste reais (CRC `29B1`, CPF `52998224725`).

**3. Consistência de tipos:**
- `ParticipanteInput` (Task 1) usado em validação (Task 11) e checkout (Task 20).
- `Lote` (Task 1) usado em `selectCurrentLote` (Task 5), `event-data` (Task 19), inscrição (Task 11), lotes admin (Task 16/24).
- `PedidoRow` definido na Task 23 e consumido na mesma task pela `PedidosTable`.
- `EventConfig` definido em `event-data` (Task 19) e consumido pelo `ConfigForm` (Task 25).
- `SESSION_COOKIE`/`verifySession`/`signSession` consistentes entre auth (Task 7), guard/middleware (Task 10) e login (Task 14).
- `buildPixPayload` (Task 4) consumido pela tela de pagamento (Task 21) com os campos exatos (`chave/nome/cidade/valorCentavos/txid`).

**4. Notas de risco conhecidas (documentadas no plano):** check de capacidade não-atômico (aceitável p/ o volume); `<>` no `map` da `PedidosTable` deve virar `<Fragment key>` (instrução incluída).

---

## Execution Handoff

Plano salvo em `docs/superpowers/plans/2026-06-26-inscricao-evento-audiologia.md`.

Pré-requisitos antes de executar a Task 11 em diante: um projeto Supabase com o `schema.sql` aplicado, `.env.local` preenchido, e ao menos um lote vigente (criado via Task 16/24 ou insert manual de teste).
