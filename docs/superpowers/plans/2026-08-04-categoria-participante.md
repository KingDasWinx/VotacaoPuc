# Categoria do participante Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coletar, persistir, administrar e exportar a categoria estudante/profissional de cada participante, preservando registros antigos como pendentes.

**Architecture:** A categoria ficará na tabela `ingressos`, onde já vivem os demais dados individuais. Uma validação compartilhada aceitará somente estudante/profissional em novas inscrições e alterações administrativas; o banco manterá também pendente para os registros antigos.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Supabase/PostgreSQL, Tailwind CSS e Vitest.

---

## Estrutura de arquivos

- Criar `supabase/add-categoria-ingressos.sql`: migração idempotente para bancos existentes.
- Modificar `supabase/schema.sql`: incluir a coluna em instalações novas.
- Modificar `lib/types.ts`: definir os valores e a validação compartilhada.
- Modificar `lib/__tests__/types.test.ts`: verificar os valores e a validação compartilhada.
- Modificar `lib/inscricao-validation.ts`: exigir categoria válida no limite público.
- Modificar `lib/inscricao-validation.test.ts`: cobrir as duas opções e rejeições.
- Modificar `components/checkout/CheckoutClient.tsx`: coletar a categoria por participante.
- Modificar `app/api/inscricao/route.ts`: persistir a categoria validada.
- Criar `app/api/admin/ingressos/[id]/categoria/route.ts`: atualizar uma categoria com autenticação administrativa.
- Modificar `app/admin/page.tsx`: carregar a categoria dos ingressos.
- Modificar `components/admin/PedidosTable.tsx`: exibir e alterar com confirmação.
- Modificar `app/api/admin/export/route.ts`: acrescentar categoria às exportações de credenciamento.

### Task 1: Modelo de dados e regra compartilhada

**Files:**
- Create: `supabase/add-categoria-ingressos.sql`
- Modify: `supabase/schema.sql:66-75`
- Modify: `lib/types.ts:4-24`
- Test: `lib/__tests__/types.test.ts`

- [ ] **Step 1: Escrever o teste da regra de categoria**

Atualizar os imports e acrescentar os testes abaixo em `lib/__tests__/types.test.ts`:

```ts
import type { Lote, ParticipanteInput } from '@/lib/types'
import { CATEGORIAS_PARTICIPANTE, INGRESSO_STATUS, PEDIDO_STATUS, isCategoriaInscricao } from '@/lib/types'

it('expõe e valida as categorias de participante', () => {
  expect(CATEGORIAS_PARTICIPANTE).toEqual(['pendente', 'estudante', 'profissional'])
  expect(isCategoriaInscricao('estudante')).toBe(true)
  expect(isCategoriaInscricao('profissional')).toBe(true)
  expect(isCategoriaInscricao('pendente')).toBe(false)
})
```

Acrescentar `categoria: 'estudante'` ao objeto `ParticipanteInput` já existente no mesmo arquivo.

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `npm test -- lib/__tests__/types.test.ts`

Expected: FAIL porque `CATEGORIAS_PARTICIPANTE` e `isCategoriaInscricao` ainda não existem e `ParticipanteInput` ainda não possui `categoria`.

- [ ] **Step 3: Implementar o tipo e a validação mínima**

Inserir após `IngressoStatus` em `lib/types.ts` e acrescentar o campo à interface:

```ts
export const CATEGORIAS_PARTICIPANTE = ['pendente', 'estudante', 'profissional'] as const
export type CategoriaParticipante = (typeof CATEGORIAS_PARTICIPANTE)[number]
export type CategoriaInscricao = Exclude<CategoriaParticipante, 'pendente'>

export function isCategoriaInscricao(value: unknown): value is CategoriaInscricao {
  return value === 'estudante' || value === 'profissional'
}

export interface ParticipanteInput {
  nome: string
  cpf: string // 11 dígitos
  data_nascimento: string // YYYY-MM-DD
  telefone: string
  categoria: CategoriaInscricao
}
```

- [ ] **Step 4: Criar a migração e atualizar o schema-base**

Criar `supabase/add-categoria-ingressos.sql`:

```sql
-- Categoria dos participantes. Registros anteriores ficam pendentes para revisão administrativa.
alter table ingressos
  add column if not exists categoria text not null default 'pendente'
  check (categoria in ('pendente', 'estudante', 'profissional'));
```

Adicionar após `telefone` na definição de `ingressos` em `supabase/schema.sql`:

```sql
  categoria        text not null default 'pendente'
                   check (categoria in ('pendente','estudante','profissional')),
```

- [ ] **Step 5: Executar o teste e confirmar sucesso**

Run: `npm test -- lib/__tests__/types.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/add-categoria-ingressos.sql supabase/schema.sql lib/types.ts lib/__tests__/types.test.ts
git commit -m "feat: add participant category model"
```

### Task 2: Cadastro público e persistência

**Files:**
- Modify: `lib/inscricao-validation.test.ts`
- Modify: `lib/inscricao-validation.ts:41-55`
- Modify: `components/checkout/CheckoutClient.tsx:9-16,85-128`
- Modify: `app/api/inscricao/route.ts:105-114`

- [ ] **Step 1: Escrever os testes da entrada pública**

Acrescentar `categoria: 'estudante'` ao participante do objeto `ok` em `lib/inscricao-validation.test.ts`. No teste de sucesso, acrescentar:

```ts
expect(r.participantes[0].categoria).toBe('estudante')
```

Acrescentar estes testes ao mesmo `describe`:

```ts
it('aceita categoria profissional', () => {
  const r = validateInscricao({
    ...ok,
    participantes: [{ ...ok.participantes[0], categoria: 'profissional' }],
  })
  expect(r.ok).toBe(true)
})

it('rejeita categoria ausente ou inválida', () => {
  const { categoria: _, ...semCategoria } = ok.participantes[0]
  expect(validateInscricao({ ...ok, participantes: [semCategoria] }).ok).toBe(false)
  expect(validateInscricao({
    ...ok,
    participantes: [{ ...ok.participantes[0], categoria: 'pendente' }],
  }).ok).toBe(false)
})
```

- [ ] **Step 2: Executar o teste e confirmar a falha**

Run: `npm test -- lib/inscricao-validation.test.ts`

Expected: FAIL porque a validação ainda ignora ou não devolve `categoria`.

- [ ] **Step 3: Validar a categoria no servidor**

Alterar o import em `lib/inscricao-validation.ts` e validar antes do `push`:

```ts
import { isCategoriaInscricao, type ParticipanteInput } from '@/lib/types'

const categoria = p.categoria

if (!isCategoriaInscricao(categoria)) {
  return { ok: false, error: `Categoria inválida para ${nome}` }
}
participantes.push({ nome, cpf, data_nascimento: dataNasc, telefone, categoria })
```

- [ ] **Step 4: Executar o teste e confirmar sucesso**

Run: `npm test -- lib/inscricao-validation.test.ts`

Expected: PASS.

- [ ] **Step 5: Coletar a categoria no formulário**

Atualizar o tipo e o estado vazio em `components/checkout/CheckoutClient.tsx`:

```ts
import type { CategoriaInscricao } from '@/lib/types'

interface Participante {
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
  categoria: CategoriaInscricao | ''
}

const vazio = (): Participante => ({
  nome: '', cpf: '', data_nascimento: '', telefone: '', categoria: '',
})
```

Adicionar após o telefone, dentro do bloco de cada participante:

```tsx
<label className="text-xs font-semibold text-ink/55">
  Categoria
  <select
    className={`${inputClass} mt-1`}
    value={p.categoria}
    onChange={(e) => update(i, 'categoria', e.target.value)}
    required
  >
    <option value="" disabled>Selecione</option>
    <option value="estudante">Estudante</option>
    <option value="profissional">Profissional</option>
  </select>
</label>
```

- [ ] **Step 6: Persistir a categoria validada**

Acrescentar ao objeto inserido em `app/api/inscricao/route.ts`:

```ts
categoria: p.categoria,
```

- [ ] **Step 7: Executar testes e verificação de tipos**

Run: `npm test -- lib/inscricao-validation.test.ts lib/__tests__/types.test.ts && npm run build`

Expected: testes PASS e build concluído sem erros.

- [ ] **Step 8: Commit**

```bash
git add lib/inscricao-validation.ts lib/inscricao-validation.test.ts components/checkout/CheckoutClient.tsx app/api/inscricao/route.ts
git commit -m "feat: collect participant category"
```

### Task 3: Alteração administrativa com aviso

**Files:**
- Create: `app/api/admin/ingressos/[id]/categoria/route.ts`
- Modify: `app/admin/page.tsx:17-21`
- Modify: `components/admin/PedidosTable.tsx:12-25,101-116,344-375`

- [ ] **Step 1: Criar a rota administrativa protegida**

Criar `app/api/admin/ingressos/[id]/categoria/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'
import { isCategoriaInscricao } from '@/lib/types'

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
  const categoria = (body as { categoria?: unknown }).categoria
  if (!isCategoriaInscricao(categoria)) {
    return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 })
  }
  const { error } = await supabase.from('ingressos').update({ categoria }).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar categoria' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Carregar a categoria no dashboard**

Em `app/admin/page.tsx`, incluir `categoria` na relação já carregada:

```ts
ingressos(id, nome, cpf, data_nascimento, telefone, categoria, status)
```

Atualizar o tipo do ingresso em `PedidoRow` dentro de `components/admin/PedidosTable.tsx`:

```ts
import type { CategoriaParticipante, CategoriaInscricao } from '@/lib/types'

ingressos: {
  id: string
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
  categoria: CategoriaParticipante
  status: string
}[]
```

- [ ] **Step 3: Implementar a atualização com confirmação explícita**

Adicionar em `PedidosTable`, junto às demais ações:

```ts
async function setCategoria(id: string, nome: string, categoria: CategoriaInscricao) {
  if (!confirm(`Você está alterando a categoria de ${nome} para ${categoria}. Deseja continuar?`)) return
  setOcupado(true)
  const res = await fetch(`/api/admin/ingressos/${id}/categoria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoria }),
  })
  if (!res.ok) {
    const data = await res.json()
    alert(data.error ?? 'Falha ao atualizar categoria')
  }
  setOcupado(false)
  router.refresh()
}
```

Adicionar após o telefone de cada participante no drawer:

```tsx
<label className="mt-2 block text-sm text-ink/70">
  Categoria
  <select
    aria-label={`Categoria de ${ing.nome}`}
    className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink"
    value={ing.categoria}
    disabled={ocupado}
    onChange={(e) => setCategoria(ing.id, ing.nome, e.target.value as CategoriaInscricao)}
  >
    <option value="pendente" disabled>Pendente</option>
    <option value="estudante">Estudante</option>
    <option value="profissional">Profissional</option>
  </select>
</label>
```

- [ ] **Step 4: Verificar compilação e comportamento manual**

Run: `npm run build`

Expected: build concluído sem erros.

Run: `npm run dev`

Expected: em `/admin`, abrir um pedido, trocar uma categoria e verificar que a confirmação cita o participante e a nova categoria; cancelar mantém o valor anterior e confirmar atualiza após o refresh.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/ingressos/[id]/categoria/route.ts app/admin/page.tsx components/admin/PedidosTable.tsx
git commit -m "feat: manage participant category"
```

### Task 4: Exportação e verificação final

**Files:**
- Modify: `app/api/admin/export/route.ts:37-53`

- [ ] **Step 1: Incluir a categoria no credenciamento**

Alterar apenas a consulta e as linhas de participantes em `app/api/admin/export/route.ts`:

```ts
.select('nome, cpf, data_nascimento, telefone, categoria, status, pedidos!inner(codigo, status)')

const rows: Rows = [
  ['Nome', 'CPF', 'Nascimento', 'Telefone', 'Categoria', 'Pedido'],
  ...(data ?? []).map((i) => {
    const pedidoRel = i.pedidos as unknown as { codigo: string } | { codigo: string }[]
    const codigo = Array.isArray(pedidoRel) ? pedidoRel[0]?.codigo : pedidoRel?.codigo
    const categoria = i.categoria[0].toUpperCase() + i.categoria.slice(1)
    return [i.nome, formatCpf(i.cpf), i.data_nascimento, i.telefone, categoria, codigo ?? '']
  }),
]
```

- [ ] **Step 2: Executar todas as verificações automatizadas**

Run: `npm test`

Expected: todos os testes PASS.

Run: `npm run lint`

Expected: lint sem erros.

Run: `npm run build`

Expected: build concluído sem erros.

- [ ] **Step 3: Verificar exportações manualmente**

Com o servidor local ativo e uma sessão administrativa, baixar credenciamento nos três formatos oferecidos pelo painel.

Expected: CSV, XLSX e PDF possuem a coluna “Categoria”; a exportação de pagamentos permanece inalterada.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/export/route.ts
git commit -m "feat: export participant category"
```

### Task 5: Aplicação no Supabase

**Files:**
- Use: `supabase/add-categoria-ingressos.sql`

- [ ] **Step 1: Aplicar a migração no banco existente**

Executar o conteúdo de `supabase/add-categoria-ingressos.sql` no SQL Editor do projeto Supabase antes de publicar a aplicação.

Expected: todos os ingressos existentes passam a ter `categoria = 'pendente'`; a coluna fica `NOT NULL` e limitada aos três valores previstos.

- [ ] **Step 2: Conferir os registros preservados**

Run no SQL Editor:

```sql
select categoria, count(*)
from ingressos
group by categoria
order by categoria;
```

Expected: registros anteriores aparecem em `pendente`; novas inscrições aparecem como `estudante` ou `profissional`.
