# Sistema de Votação PUCPR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js 14 voting system for PUCPR class leader election with candidate registration, time-gated voting, and Supabase backend fully hidden from the client.

**Architecture:** Next.js 14 App Router with Server Components and Route Handlers. All Supabase access is server-side only (service role key never reaches the browser). Rate limiting via Upstash Redis. Candidate registration protected by a secret query param. Duplicate vote prevention via both localStorage (UX) and a server-side UNIQUE constraint on voter name.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Storage), @upstash/ratelimit, @upstash/redis, Montserrat (Google Fonts), Vercel deploy.

---

## File Structure

```
votacao-pucpr/
├── app/
│   ├── layout.tsx                  # Root layout: Montserrat font, metadata, max-w-[430px]
│   ├── globals.css                 # Tailwind base + PUCPR CSS custom vars
│   ├── votar/
│   │   └── page.tsx                # /votar — voting page (server component fetches config)
│   ├── candidatos/
│   │   └── page.tsx                # /candidatos — candidate registration (secret-gated)
│   └── api/
│       ├── config/
│       │   └── route.ts            # GET /api/config — returns votacao_inicio, votacao_fim
│       ├── candidatos/
│       │   └── route.ts            # GET list / POST create candidate (secret + rate limit)
│       ├── votos/
│       │   └── route.ts            # POST register vote (time guard + uniqueness + rate limit)
│       └── upload/
│           └── route.ts            # POST upload photo to Supabase Storage (rate limit)
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx              # "GRUPO MARISTA | PUCPR" dark strip
│   │   └── Header.tsx              # White header with PUC logo + election badge
│   ├── votar/
│   │   ├── VotingClient.tsx        # Client component: full voting flow state machine
│   │   ├── BlockedScreen.tsx       # Countdown timer when voting not yet open
│   │   ├── AlreadyVotedScreen.tsx  # localStorage voted=true screen
│   │   ├── CandidateList.tsx       # Grid of candidate cards
│   │   ├── CandidateCard.tsx       # Single candidate card (selectable)
│   │   ├── ConfirmModal.tsx        # Bottom sheet: name input + confirm button
│   │   └── SuccessScreen.tsx       # Post-vote success screen
│   └── candidatos/
│       ├── RegisterClient.tsx      # Client component: registration form state
│       ├── PhotoUpload.tsx         # Camera/gallery input with preview
│       └── RegisterSuccess.tsx     # Post-registration success screen
├── lib/
│   ├── supabase.ts                 # Server-only Supabase client (service role)
│   ├── ratelimit.ts                # Upstash ratelimit factory helpers
│   └── normalize.ts               # trim + toLowerCase name normalization
├── types/
│   └── index.ts                   # Candidato, Voto, Config TypeScript types
├── .env.local                      # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CANDIDATO_SECRET, UPSTASH_*
├── .env.example                    # Template with all required vars (no values)
├── tailwind.config.ts              # PUCPR color tokens
└── next.config.ts                  # Image domains for Supabase Storage
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json` (via scaffold)
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `.env.example`
- Create: `.env.local`
- Create: `types/index.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd c:/Users/kingdaswinx/Documents/GitHub/VotacaoPuc
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --use-npm
```

When prompted, answer: Yes to all defaults. This installs Next.js 14, TypeScript, Tailwind CSS, ESLint.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @upstash/redis @upstash/ratelimit
```

- [ ] **Step 3: Configure Tailwind with PUCPR colors**

Replace contents of `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        puc: {
          bordeaux: '#8B0033',
          red: '#E8000D',
          purple: '#5B0099',
          dark: '#2d2d3a',
          bg: '#f5f5f5',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 4: Configure globals.css**

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap');

body {
  font-family: 'Montserrat', sans-serif;
  background-color: #f5f5f5;
}
```

- [ ] **Step 5: Configure root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eleição Líder de Turma — PUCPR',
  description: 'Vote no seu representante de turma',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-puc-bg font-montserrat">
        <div className="max-w-mobile mx-auto min-h-screen bg-white shadow-lg">
          {children}
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Create TypeScript types**

Create `types/index.ts`:

```ts
export interface Candidato {
  id: string
  nome: string
  frase: string
  foto_url: string
  created_at: string
}

export interface Voto {
  id: string
  candidato_id: string
  nome_votante: string
  created_at: string
}

export interface Config {
  id: number
  votacao_inicio: string // ISO timestamptz
  votacao_fim: string | null
}
```

- [ ] **Step 7: Create .env.example**

Create `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CANDIDATO_SECRET=your-secret-string
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

- [ ] **Step 8: Create .env.local with real values**

Create `.env.local` (fill in real values from Supabase dashboard and Upstash dashboard):

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CANDIDATO_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

To get Supabase values: go to https://supabase.com → your project → Settings → API.
To get Upstash values: go to https://console.upstash.com → create a Redis database → copy REST URL and token.

- [ ] **Step 9: Verify next.config.ts allows Supabase Storage images**

Edit `next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000 with no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 14 project with PUCPR theme and dependencies"
```

---

## Task 2: Supabase Schema + Storage Setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/normalize.ts`
- Create SQL migration (applied via Supabase MCP)

- [ ] **Step 1: Create server-only Supabase client**

Create `lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

// This file must never be imported in client components.
// It uses the service role key which must stay server-side only.
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

- [ ] **Step 2: Create name normalization utility**

Create `lib/normalize.ts`:

```ts
/**
 * Normalizes a name for deduplication:
 * - Trims leading/trailing whitespace
 * - Collapses internal multiple spaces to single space
 * - Converts to lowercase
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
```

- [ ] **Step 3: Apply Supabase database migration**

Use the Supabase MCP tool to apply this SQL migration to project `hlinqrjupmcnltyezfns`:

```sql
-- Create candidatos table
CREATE TABLE candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  frase text NOT NULL CHECK (char_length(frase) <= 80),
  foto_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create config table with a single row
CREATE TABLE config (
  id int PRIMARY KEY,
  votacao_inicio timestamptz NOT NULL,
  votacao_fim timestamptz
);

-- Insert the single config row (edit this date in Supabase Studio to open voting)
INSERT INTO config (id, votacao_inicio, votacao_fim)
VALUES (1, now() + interval '7 days', NULL);

-- Create votos table
CREATE TABLE votos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES candidatos(id) ON DELETE RESTRICT,
  nome_votante text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Disable Row Level Security (all access via service role server-side only)
ALTER TABLE candidatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE config DISABLE ROW LEVEL SECURITY;
ALTER TABLE votos DISABLE ROW LEVEL SECURITY;
```

- [ ] **Step 4: Create Supabase Storage bucket**

Use the Supabase MCP tool to execute:

```sql
-- Create storage bucket for candidate photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidatos-fotos', 'candidatos-fotos', true);
```

- [ ] **Step 5: Verify tables exist**

Use Supabase MCP `list_tables` to confirm `candidatos`, `votos`, `config` are created.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase.ts lib/normalize.ts
git commit -m "feat: add Supabase client, normalization util, and apply DB migration"
```

---

## Task 3: Rate Limiting Utility

**Files:**
- Create: `lib/ratelimit.ts`

- [ ] **Step 1: Create rate limiting helpers**

Create `lib/ratelimit.ts`:

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 10 requests per minute — for /api/votos
export const votosRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:votos',
})

// 5 requests per minute — for /api/candidatos and /api/upload
export const candidatosRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:candidatos',
})

export const uploadRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:upload',
})

/**
 * Extracts client IP from Next.js request headers.
 * Falls back to 'anonymous' if not available.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'anonymous'
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ratelimit.ts
git commit -m "feat: add Upstash rate limiting helpers"
```

---

## Task 4: API Route — /api/config

**Files:**
- Create: `app/api/config/route.ts`

- [ ] **Step 1: Implement GET /api/config**

Create `app/api/config/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Config not found' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=30',
    },
  })
}
```

- [ ] **Step 2: Test manually**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/config
```

Expected: JSON with `votacao_inicio` and `votacao_fim` fields.

- [ ] **Step 3: Commit**

```bash
git add app/api/config/route.ts
git commit -m "feat: add GET /api/config route with 30s cache"
```

---

## Task 5: API Route — /api/upload

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Implement POST /api/upload**

Create `app/api/upload/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await uploadRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Must be an image (JPEG, PNG, WebP, GIF).' },
      { status: 400 }
    )
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB.' },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('candidatos-fotos')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('candidatos-fotos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: urlData.publicUrl })
}
```

- [ ] **Step 2: Test manually**

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/test-image.jpg"
```

Expected: `{ "url": "https://..." }` with a Supabase Storage URL.

- [ ] **Step 3: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add POST /api/upload with type/size validation and rate limiting"
```

---

## Task 6: API Route — /api/candidatos

**Files:**
- Create: `app/api/candidatos/route.ts`

- [ ] **Step 1: Implement GET and POST /api/candidatos**

Create `app/api/candidatos/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/normalize'
import { candidatosRatelimit, getClientIp } from '@/lib/ratelimit'

const CANDIDATO_SECRET = process.env.CANDIDATO_SECRET!
const MAX_CANDIDATOS = 20

export async function GET() {
  const { data, error } = await supabase
    .from('candidatos')
    .select('id, nome, frase, foto_url, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await candidatosRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Secret check
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== CANDIDATO_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, frase, foto_url } = body

  if (!nome || !frase || !foto_url) {
    return NextResponse.json({ error: 'Missing required fields: nome, frase, foto_url' }, { status: 400 })
  }

  if (frase.length > 80) {
    return NextResponse.json({ error: 'frase must be 80 characters or less' }, { status: 400 })
  }

  const nomeNorm = normalizeName(nome)

  // Check max candidates
  const { count } = await supabase
    .from('candidatos')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) >= MAX_CANDIDATOS) {
    return NextResponse.json({ error: 'Maximum number of candidates reached' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('candidatos')
    .insert({ nome: nomeNorm, frase, foto_url })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A candidate with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Test GET**

```bash
curl http://localhost:3000/api/candidatos
```

Expected: `[]` (empty array, no candidates yet).

- [ ] **Step 3: Test POST without secret**

```bash
curl -X POST http://localhost:3000/api/candidatos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","frase":"test","foto_url":"http://example.com/x.jpg"}'
```

Expected: `{ "error": "Forbidden" }` with status 403.

- [ ] **Step 4: Commit**

```bash
git add app/api/candidatos/route.ts
git commit -m "feat: add GET/POST /api/candidatos with secret gate, deduplication, and rate limiting"
```

---

## Task 7: API Route — /api/votos

**Files:**
- Create: `app/api/votos/route.ts`

- [ ] **Step 1: Implement POST /api/votos**

Create `app/api/votos/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/normalize'
import { votosRatelimit, getClientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await votosRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Check voting window
  const { data: config, error: configError } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single()

  if (configError || !config) {
    return NextResponse.json({ error: 'Voting configuration not found' }, { status: 500 })
  }

  const now = new Date()
  const inicio = new Date(config.votacao_inicio)
  const fim = config.votacao_fim ? new Date(config.votacao_fim) : null

  if (now < inicio) {
    return NextResponse.json({ error: 'Voting has not started yet' }, { status: 403 })
  }

  if (fim && now > fim) {
    return NextResponse.json({ error: 'Voting has ended' }, { status: 403 })
  }

  const body = await request.json()
  const { candidato_id, nome_votante } = body

  if (!candidato_id || !nome_votante) {
    return NextResponse.json({ error: 'Missing required fields: candidato_id, nome_votante' }, { status: 400 })
  }

  const nomeNorm = normalizeName(nome_votante)

  if (nomeNorm.length < 2) {
    return NextResponse.json({ error: 'nome_votante is too short' }, { status: 400 })
  }

  // Verify candidate exists
  const { data: candidato } = await supabase
    .from('candidatos')
    .select('id')
    .eq('id', candidato_id)
    .single()

  if (!candidato) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('votos')
    .insert({ candidato_id, nome_votante: nomeNorm })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already voted' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to register vote' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Test time guard**

Temporarily set `votacao_inicio` to a future date in Supabase Studio, then:

```bash
curl -X POST http://localhost:3000/api/votos \
  -H "Content-Type: application/json" \
  -d '{"candidato_id":"some-uuid","nome_votante":"Joao"}'
```

Expected: `{ "error": "Voting has not started yet" }` with status 403.

Reset `votacao_inicio` to a past date after testing.

- [ ] **Step 3: Commit**

```bash
git add app/api/votos/route.ts
git commit -m "feat: add POST /api/votos with time window guard, deduplication, and rate limiting"
```

---

## Task 8: Layout Components

**Files:**
- Create: `components/layout/TopBar.tsx`
- Create: `components/layout/Header.tsx`

- [ ] **Step 1: Create TopBar component**

Create `components/layout/TopBar.tsx`:

```tsx
export default function TopBar() {
  return (
    <div className="bg-puc-dark text-gray-300 text-[10px] font-semibold tracking-widest uppercase text-center py-1.5 px-4">
      GRUPO MARISTA&nbsp;&nbsp;|&nbsp;&nbsp;PUCPR
    </div>
  )
}
```

- [ ] **Step 2: Create Header component**

Create `components/layout/Header.tsx`:

```tsx
interface HeaderProps {
  badge?: string
}

export default function Header({ badge = 'Eleição 2026' }: HeaderProps) {
  return (
    <header className="bg-white border-b-[3px] border-puc-bordeaux px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 bg-puc-bordeaux rounded flex items-center justify-center text-white font-black text-sm tracking-tight leading-none">
          PUC
        </div>
        <div>
          <div className="text-puc-bordeaux text-[22px] font-black tracking-wide leading-none">
            PUCPR
          </div>
          <div className="text-puc-bordeaux text-[8px] font-bold tracking-[2px] uppercase opacity-70">
            GRUPO MARISTA
          </div>
        </div>
      </div>
      {badge && (
        <span className="bg-puc-bordeaux text-white text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full">
          {badge}
        </span>
      )}
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/TopBar.tsx components/layout/Header.tsx
git commit -m "feat: add TopBar and Header layout components"
```

---

## Task 9: Voting Page — Blocked & Already Voted Screens

**Files:**
- Create: `components/votar/BlockedScreen.tsx`
- Create: `components/votar/AlreadyVotedScreen.tsx`

- [ ] **Step 1: Create BlockedScreen with live countdown**

Create `components/votar/BlockedScreen.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

interface BlockedScreenProps {
  votacaoInicio: string
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function BlockedScreen({ votacaoInicio }: BlockedScreenProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function update() {
      const diff = new Date(votacaoInicio).getTime() - Date.now()
      if (diff <= 0) {
        window.location.reload()
        return
      }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [votacaoInicio])

  const openDate = new Date(votacaoInicio).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div>
      {/* Hero */}
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2">
          Eleição de Liderança
        </p>
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          LÍDER<br />DE <span className="text-pink-300">TURMA</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">
          Sua voz define quem vai te representar neste semestre.
        </p>
      </div>

      {/* Countdown card */}
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-8 text-center">
            <h2 className="text-white text-xl font-black uppercase tracking-wide mb-1">
              Votação Fechada
            </h2>
            <p className="text-white/70 text-sm">A votação abrirá em breve</p>
          </div>
          <div className="flex justify-center items-center gap-2 px-4 py-7">
            {[
              { value: timeLeft.days, label: 'Dias' },
              { value: timeLeft.hours, label: 'Horas' },
              { value: timeLeft.minutes, label: 'Min' },
              { value: timeLeft.seconds, label: 'Seg' },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                {i > 0 && <span className="text-puc-bordeaux text-4xl font-black leading-none pb-4">:</span>}
                <div className="text-center">
                  <span className="block text-puc-bordeaux text-4xl font-black leading-none">
                    {pad(item.value)}
                  </span>
                  <span className="block text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-pink-50 px-6 py-4 flex items-start gap-3 border-t border-pink-100">
            <span className="text-xl mt-0.5">📅</span>
            <p className="text-sm text-gray-600 leading-relaxed">
              Abertura em <strong className="text-puc-bordeaux">{openDate}</strong>.
              <br />Volte nesta hora para votar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AlreadyVotedScreen**

Create `components/votar/AlreadyVotedScreen.tsx`:

```tsx
export default function AlreadyVotedScreen() {
  return (
    <div>
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          OBRIGADO<br />PELO <span className="text-pink-300">VOTO!</span>
        </h1>
      </div>
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="text-5xl mb-3">🗳️</div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">
              Voto Registrado!
            </h2>
            <p className="text-white/75 text-sm">Sua participação faz a diferença.</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Você já votou nesta eleição.<br />
              Cada aluno pode votar apenas uma vez.<br /><br />
              Aguarde o resultado ser divulgado pela coordenação.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/votar/BlockedScreen.tsx components/votar/AlreadyVotedScreen.tsx
git commit -m "feat: add BlockedScreen with live countdown and AlreadyVotedScreen"
```

---

## Task 10: Voting Page — Candidate Cards & Success Screen

**Files:**
- Create: `components/votar/CandidateCard.tsx`
- Create: `components/votar/CandidateList.tsx`
- Create: `components/votar/SuccessScreen.tsx`

- [ ] **Step 1: Create CandidateCard**

Create `components/votar/CandidateCard.tsx`:

```tsx
import Image from 'next/image'
import { Candidato } from '@/types'

interface CandidateCardProps {
  candidato: Candidato
  selected: boolean
  onSelect: (id: string) => void
}

export default function CandidateCard({ candidato, selected, onSelect }: CandidateCardProps) {
  return (
    <button
      onClick={() => onSelect(candidato.id)}
      className={`w-full flex items-stretch bg-white rounded shadow-sm text-left transition-all duration-150
        border-l-4 ${selected ? 'border-puc-red shadow-lg scale-[1.01]' : 'border-puc-bordeaux'}
      `}
    >
      {/* Photo */}
      <div className="relative w-[90px] min-h-[110px] bg-puc-bordeaux flex-shrink-0 overflow-hidden">
        <Image
          src={candidato.foto_url}
          alt={candidato.nome}
          fill
          className="object-cover"
          sizes="90px"
        />
        {selected && (
          <div className="absolute top-1.5 right-1.5 bg-puc-red rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-black">
            ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col justify-center flex-1">
        <p className="text-[15px] font-extrabold text-gray-900 uppercase tracking-wide mb-1.5 capitalize">
          {candidato.nome}
        </p>
        <p className="text-[12px] text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-2">
          "{candidato.frase}"
        </p>
        <p className="mt-2 text-[11px] text-puc-bordeaux font-bold uppercase tracking-wide">
          {selected ? 'Selecionado ✓' : 'Selecionar →'}
        </p>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Create CandidateList**

Create `components/votar/CandidateList.tsx`:

```tsx
import { Candidato } from '@/types'
import CandidateCard from './CandidateCard'

interface CandidateListProps {
  candidatos: Candidato[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CandidateList({ candidatos, selectedId, onSelect }: CandidateListProps) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 pt-6 pb-3.5">
        <div className="w-1 h-[22px] bg-puc-bordeaux rounded-sm" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-gray-800">
          Candidatos
        </h2>
      </div>

      {/* Cards */}
      <div className="px-4 flex flex-col gap-3.5 pb-32">
        {candidatos.map((c) => (
          <CandidateCard
            key={c.id}
            candidato={c}
            selected={selectedId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create SuccessScreen**

Create `components/votar/SuccessScreen.tsx`:

```tsx
export default function SuccessScreen() {
  return (
    <div>
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          OBRIGADO<br />PELO <span className="text-pink-300">VOTO!</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">
          Sua participação faz a diferença.
        </p>
      </div>
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">
              Voto Registrado!
            </h2>
            <p className="text-white/75 text-sm">Seu voto foi contabilizado com sucesso.</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Aguarde o resultado ser divulgado<br />pela coordenação do curso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/votar/CandidateCard.tsx components/votar/CandidateList.tsx components/votar/SuccessScreen.tsx
git commit -m "feat: add CandidateCard, CandidateList, and SuccessScreen components"
```

---

## Task 11: Voting Page — Confirm Modal

**Files:**
- Create: `components/votar/ConfirmModal.tsx`

- [ ] **Step 1: Create ConfirmModal (bottom sheet)**

Create `components/votar/ConfirmModal.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Candidato } from '@/types'

interface ConfirmModalProps {
  candidato: Candidato
  onConfirm: (nomeVotante: string) => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string | null
}

export default function ConfirmModal({ candidato, onConfirm, onCancel, loading, error }: ConfirmModalProps) {
  const [nome, setNome] = useState('')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50">
      <div className="bg-white rounded-t-[20px] w-full max-w-mobile mx-auto px-6 pt-6 pb-10 animate-slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />

        {/* Selected candidate summary */}
        <div className="flex items-center gap-3.5 bg-pink-50 rounded p-3.5 mb-6 border-l-4 border-puc-bordeaux">
          <div className="relative w-14 h-14 rounded-full bg-puc-bordeaux flex-shrink-0 overflow-hidden">
            <Image
              src={candidato.foto_url}
              alt={candidato.nome}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div>
            <p className="text-base font-extrabold text-gray-900 uppercase tracking-wide capitalize">
              {candidato.nome}
            </p>
            <p className="text-xs text-gray-500 italic mt-0.5">"{candidato.frase}"</p>
          </div>
        </div>

        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-1.5">
          Confirmar<br />Voto
        </h2>
        <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
          Para registrar seu voto, informe seu nome completo abaixo. Este registro é único e não poderá ser alterado.
        </p>

        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Seu nome completo
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: João da Silva"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors mb-1"
          disabled={loading}
        />

        {error && (
          <p className="text-puc-red text-xs font-semibold mb-3 mt-1">{error}</p>
        )}

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            onClick={() => onConfirm(nome)}
            disabled={loading || nome.trim().length < 2}
            className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'Registrando...' : 'Confirmar meu voto'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full border-2 border-puc-bordeaux text-puc-bordeaux rounded-full py-3.5 text-[13px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            ← Voltar e trocar candidato
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add slide-up animation to Tailwind config**

Add to `tailwind.config.ts` inside `theme.extend`:

```ts
keyframes: {
  'slide-up': {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
},
animation: {
  'slide-up': 'slide-up 0.3s ease-out',
},
```

- [ ] **Step 3: Commit**

```bash
git add components/votar/ConfirmModal.tsx tailwind.config.ts
git commit -m "feat: add ConfirmModal bottom sheet with slide-up animation"
```

---

## Task 12: Voting Page — Client State Machine

**Files:**
- Create: `components/votar/VotingClient.tsx`

- [ ] **Step 1: Create VotingClient — orchestrates all voting states**

Create `components/votar/VotingClient.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Candidato, Config } from '@/types'
import BlockedScreen from './BlockedScreen'
import AlreadyVotedScreen from './AlreadyVotedScreen'
import CandidateList from './CandidateList'
import ConfirmModal from './ConfirmModal'
import SuccessScreen from './SuccessScreen'

type Screen = 'loading' | 'blocked' | 'ended' | 'already-voted' | 'voting' | 'confirming' | 'success'

interface VotingClientProps {
  config: Config
  candidatos: Candidato[]
}

const VOTED_KEY = 'pucpr_voted'

export default function VotingClient({ config, candidatos }: VotingClientProps) {
  const [screen, setScreen] = useState<Screen>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [voteLoading, setVoteLoading] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const inicio = new Date(config.votacao_inicio)
    const fim = config.votacao_fim ? new Date(config.votacao_fim) : null

    if (now < inicio) {
      setScreen('blocked')
      return
    }

    if (fim && now > fim) {
      setScreen('ended')
      return
    }

    // Check localStorage for prior vote
    try {
      const stored = localStorage.getItem(VOTED_KEY)
      if (stored) {
        setScreen('already-voted')
        return
      }
    } catch {
      // localStorage unavailable — proceed normally
    }

    setScreen('voting')
  }, [config])

  const selectedCandidato = candidatos.find((c) => c.id === selectedId) ?? null

  async function handleConfirmVote(nomeVotante: string) {
    if (!selectedId) return
    setVoteLoading(true)
    setVoteError(null)

    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidato_id: selectedId, nome_votante: nomeVotante }),
      })

      if (res.status === 409) {
        setVoteError('Este nome já foi usado para votar. Se você já votou, a votação não pode ser repetida.')
        setVoteLoading(false)
        return
      }

      if (res.status === 403) {
        const data = await res.json()
        setVoteError(data.error ?? 'A votação não está disponível no momento.')
        setVoteLoading(false)
        return
      }

      if (!res.ok) {
        setVoteError('Erro ao registrar voto. Tente novamente.')
        setVoteLoading(false)
        return
      }

      // Mark as voted in localStorage
      try {
        localStorage.setItem(VOTED_KEY, JSON.stringify({ voted: true, timestamp: Date.now() }))
      } catch {
        // OK if localStorage is unavailable
      }

      setScreen('success')
    } catch {
      setVoteError('Erro de conexão. Verifique sua internet e tente novamente.')
      setVoteLoading(false)
    }
  }

  if (screen === 'loading') return null

  if (screen === 'blocked') {
    return <BlockedScreen votacaoInicio={config.votacao_inicio} />
  }

  if (screen === 'ended') {
    return (
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="text-5xl mb-3">🔒</div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">
              Votação Encerrada
            </h2>
            <p className="text-white/75 text-sm">O período de votação foi encerrado.</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Aguarde o resultado ser divulgado pela coordenação do curso.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'already-voted') {
    return <AlreadyVotedScreen />
  }

  if (screen === 'success') {
    return <SuccessScreen />
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2 relative z-10">
          Eleição de Liderança · 2026
        </p>
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          VOTE NO<br />SEU <span className="text-pink-300">LÍDER</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">
          Selecione um candidato abaixo para confirmar seu voto.
        </p>
      </div>

      {/* Candidate list */}
      <CandidateList
        candidatos={candidatos}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Sticky vote button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile bg-white border-t border-gray-100 shadow-xl px-5 py-3.5 z-40">
        <button
          disabled={!selectedId}
          onClick={() => setScreen('confirming')}
          className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Votar neste candidato
        </button>
      </div>

      {/* Confirm modal */}
      {screen === 'confirming' && selectedCandidato && (
        <ConfirmModal
          candidato={selectedCandidato}
          onConfirm={handleConfirmVote}
          onCancel={() => { setScreen('voting'); setVoteError(null) }}
          loading={voteLoading}
          error={voteError}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/votar/VotingClient.tsx
git commit -m "feat: add VotingClient state machine orchestrating all voting screens"
```

---

## Task 13: Voting Page — Route (Server Component)

**Files:**
- Create: `app/votar/page.tsx`

- [ ] **Step 1: Create /votar server component**

Create `app/votar/page.tsx`:

```tsx
import { supabase } from '@/lib/supabase'
import { Config, Candidato } from '@/types'
import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import VotingClient from '@/components/votar/VotingClient'

export const dynamic = 'force-dynamic'

export default async function VotarPage() {
  // Fetch config server-side
  const { data: config } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single<Config>()

  // Fetch candidates server-side
  const { data: candidatos } = await supabase
    .from('candidatos')
    .select('id, nome, frase, foto_url, created_at')
    .order('created_at', { ascending: true })

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Configuração de votação não encontrada.
      </div>
    )
  }

  return (
    <>
      <TopBar />
      <Header />
      <VotingClient
        config={config}
        candidatos={(candidatos as Candidato[]) ?? []}
      />
    </>
  )
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev
```

Open http://localhost:3000/votar — should show the blocked screen (voting hasn't started yet based on the default config row set to `now() + 7 days`).

- [ ] **Step 3: Test with voting open**

In Supabase Studio, set `votacao_inicio` to a past datetime (e.g., `2026-01-01 00:00:00+00`). Reload the page — should show candidate list (empty if no candidates yet).

- [ ] **Step 4: Commit**

```bash
git add app/votar/page.tsx
git commit -m "feat: add /votar server component page with SSR data fetching"
```

---

## Task 14: Candidate Registration — Components

**Files:**
- Create: `components/candidatos/PhotoUpload.tsx`
- Create: `components/candidatos/RegisterSuccess.tsx`
- Create: `components/candidatos/RegisterClient.tsx`

- [ ] **Step 1: Create PhotoUpload component**

Create `components/candidatos/PhotoUpload.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface PhotoUploadProps {
  onUpload: (url: string) => void
  disabled: boolean
}

export default function PhotoUpload({ onUpload, disabled }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    // Local preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload to server
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro no upload. Tente novamente.')
      setPreview(null)
      setUploading(false)
      return
    }

    const { url } = await res.json()
    onUpload(url)
    setUploading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-full h-44 bg-pink-50 border-2 border-dashed border-puc-bordeaux rounded flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 relative overflow-hidden"
      >
        {preview ? (
          <Image src={preview} alt="Preview" fill className="object-cover" />
        ) : (
          <>
            <span className="text-4xl mb-2">{uploading ? '⏳' : '📷'}</span>
            <p className="text-puc-bordeaux text-[13px] font-bold uppercase tracking-wide">
              {uploading ? 'Enviando...' : 'Adicionar foto'}
            </p>
            <p className="text-gray-400 text-[11px] mt-1">Câmera ou galeria do celular</p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className="text-puc-red text-xs font-semibold mt-1.5">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Create RegisterSuccess**

Create `components/candidatos/RegisterSuccess.tsx`:

```tsx
export default function RegisterSuccess({ nome }: { nome: string }) {
  return (
    <div className="p-4">
      <div className="bg-white rounded shadow-md overflow-hidden">
        <div className="bg-puc-bordeaux px-6 py-10 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">
            Cadastro Realizado!
          </h2>
          <p className="text-white/75 text-sm">Boa sorte na eleição!</p>
        </div>
        <div className="px-6 py-6 text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            <span className="capitalize font-bold text-puc-bordeaux">{nome}</span>, sua candidatura foi registrada com sucesso.<br /><br />
            Aguarde o período de votação para que seus colegas possam votar em você.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create RegisterClient**

Create `components/candidatos/RegisterClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import PhotoUpload from './PhotoUpload'
import RegisterSuccess from './RegisterSuccess'

interface RegisterClientProps {
  secret: string
}

export default function RegisterClient({ secret }: RegisterClientProps) {
  const [fotoUrl, setFotoUrl] = useState('')
  const [nome, setNome] = useState('')
  const [frase, setFrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (success) return <RegisterSuccess nome={nome} />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fotoUrl) {
      setError('Por favor, adicione uma foto antes de continuar.')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/candidatos?secret=${encodeURIComponent(secret)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, frase, foto_url: fotoUrl }),
    })

    if (res.status === 409) {
      setError('Já existe um candidato com este nome. Verifique se você já se cadastrou.')
      setLoading(false)
      return
    }

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao cadastrar. Tente novamente.')
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-10">
      {/* Photo */}
      <div className="mb-5">
        <PhotoUpload onUpload={setFotoUrl} disabled={loading} />
      </div>

      {/* Nome */}
      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Nome completo
        </label>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como aparecerá na votação"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors"
          disabled={loading}
        />
      </div>

      {/* Frase */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
          Frase de campanha
        </label>
        <input
          type="text"
          required
          maxLength={80}
          value={frase}
          onChange={(e) => setFrase(e.target.value)}
          placeholder="Sua mensagem para os colegas"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors"
          disabled={loading}
        />
        <p className="text-right text-gray-400 text-[11px] mt-1">
          {frase.length} / 80
        </p>
      </div>

      {error && (
        <p className="text-puc-red text-xs font-semibold mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !fotoUrl}
        className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar candidatura →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/candidatos/PhotoUpload.tsx components/candidatos/RegisterSuccess.tsx components/candidatos/RegisterClient.tsx
git commit -m "feat: add candidate registration components (PhotoUpload, RegisterSuccess, RegisterClient)"
```

---

## Task 15: Candidate Registration Page — Route

**Files:**
- Create: `app/candidatos/page.tsx`

- [ ] **Step 1: Create /candidatos server component**

Create `app/candidatos/page.tsx`:

```tsx
import { headers } from 'next/headers'
import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import RegisterClient from '@/components/candidatos/RegisterClient'

export const dynamic = 'force-dynamic'

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: { secret?: string }
}) {
  const secret = searchParams.secret ?? ''
  const expectedSecret = process.env.CANDIDATO_SECRET ?? ''

  if (!secret || secret !== expectedSecret) {
    return (
      <>
        <TopBar />
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-black uppercase text-puc-bordeaux mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Esta página é restrita aos candidatos.<br />
            Use o link enviado pelo organizador da eleição.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <Header badge="Candidatura" />

      {/* Hero */}
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 relative overflow-hidden mb-6">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2 relative z-10">
          Candidatura
        </p>
        <h1 className="text-white text-[32px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          CADASTRE<br />SUA <span className="text-pink-300">CHAPA</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">
          Preencha seus dados para concorrer à liderança de turma.
        </p>
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2.5 px-4 pb-4">
        <div className="w-1 h-[22px] bg-puc-bordeaux rounded-sm" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-gray-800">
          Seus dados
        </h2>
      </div>

      <RegisterClient secret={secret} />
    </>
  )
}
```

- [ ] **Step 2: Test access without secret**

Open http://localhost:3000/candidatos — should show "Acesso Restrito" screen.

- [ ] **Step 3: Test access with secret**

Open http://localhost:3000/candidatos?secret=YOUR_SECRET_FROM_ENV — should show the registration form.

- [ ] **Step 4: Test full candidate registration**

Fill in the form, upload a photo, submit. Verify the candidate appears in Supabase `candidatos` table.

- [ ] **Step 5: Verify the candidate appears on /votar**

Open http://localhost:3000/votar (with voting open) — the registered candidate should appear.

- [ ] **Step 6: Commit**

```bash
git add app/candidatos/page.tsx
git commit -m "feat: add /candidatos page with secret gate and registration form"
```

---

## Task 16: Final Polish & Root Redirect

**Files:**
- Modify: `app/page.tsx` (root redirect)

- [ ] **Step 1: Redirect root to /votar**

Replace `app/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/votar')
}
```

- [ ] **Step 2: Run full production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or ESLint errors.

- [ ] **Step 3: Verify full flow end-to-end**

1. Open `/votar` — see blocked screen (or voting screen if config allows)
2. Open `/candidatos?secret=YOUR_SECRET` — register a test candidate
3. Open `/votar` — see the candidate in the list
4. Select candidate → click "Votar" → enter name → confirm
5. See success screen
6. Close and reopen `/votar` — see "já votou" screen
7. Open `/candidatos` (without secret) — see restricted access screen

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redirect root to /votar and final polish"
```

---

## Task 17: Deploy to Vercel

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Connect to Vercel**

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `VotacaoPuc` repository
3. Framework preset: Next.js (auto-detected)

- [ ] **Step 3: Add environment variables in Vercel dashboard**

In Project Settings → Environment Variables, add:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CANDIDATO_SECRET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

- [ ] **Step 4: Deploy**

Click Deploy. Wait for build to complete.

- [ ] **Step 5: Smoke test production**

Open the Vercel URL and verify:
- `/votar` loads and shows correct state
- `/candidatos?secret=...` shows registration form
- Candidate registration works (photo uploads to Supabase Storage)

---

## Summary

| Task | What it produces |
|---|---|
| 1 | Next.js 14 project bootstrapped with PUCPR theme |
| 2 | Supabase schema (3 tables) + Storage bucket |
| 3 | Rate limiting utility (Upstash) |
| 4 | `GET /api/config` |
| 5 | `POST /api/upload` |
| 6 | `GET/POST /api/candidatos` |
| 7 | `POST /api/votos` |
| 8 | TopBar + Header layout components |
| 9 | BlockedScreen + AlreadyVotedScreen |
| 10 | CandidateCard + CandidateList + SuccessScreen |
| 11 | ConfirmModal (bottom sheet) |
| 12 | VotingClient state machine |
| 13 | `/votar` page (server component) |
| 14 | PhotoUpload + RegisterSuccess + RegisterClient |
| 15 | `/candidatos` page (secret-gated) |
| 16 | Root redirect + end-to-end test + build |
| 17 | Vercel deploy |
