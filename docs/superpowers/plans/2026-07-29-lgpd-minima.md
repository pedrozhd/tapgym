# LGPD mínima — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar política, termos, exclusão self-serve, mapa/incidente internos e links públicos conforme `docs/superpowers/specs/2026-07-29-lgpd-minima-lancamento-design.md`.

**Architecture:** Rotas `/privacidade` e `/termos` públicas (middleware allowlist) com Markdown em `content/legal/` e parser mínimo; `POST /api/conta/excluir` com service role (Stripe cancel + limpeza de tabelas + `deleteUser`); docs em `docs/lgpd/`.

**Tech Stack:** Next.js App Router, Supabase Admin, Stripe, Markdown versionado sem MDX.

## Global Constraints

- Sem dependência nova (sem MDX).
- Copy sem travessão (`—`).
- Contato único: `contato@tapgym.com.br` (produto e privacidade).
- Texto legal = rascunho fiel à stack; controlador como pessoa física até haver empresa.
- Verificação: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

---

## File map

| Path | Role |
|---|---|
| `src/lib/supabase/middleware.ts` | Allowlist `/privacidade`, `/termos` |
| `src/app/(legal)/layout.tsx` | Shell marketing das páginas legais |
| `src/app/(legal)/privacidade/page.tsx` | Página política |
| `src/app/(legal)/termos/page.tsx` | Página termos |
| `src/lib/legal/markdown.tsx` | Ler `.md` + render mínimo |
| `content/legal/privacidade.md` | Conteúdo política |
| `content/legal/termos.md` | Conteúdo termos |
| `src/components/legal/legal-footer-links.tsx` | Links reutilizáveis |
| `src/app/page.tsx`, `login/page.tsx`, `assinar/page.tsx` | Links no footer |
| `src/app/api/conta/excluir/route.ts` | Exclusão |
| `src/components/layout/account-sheet.tsx` | UI dois toques |
| `docs/lgpd/mapa-dados.md`, `incidente.md` | Ops internos |
| `docs/CEREBRO.md` | Ponte curta |

---

### Task 1: Middleware + páginas legais (esqueleto)

**Files:** middleware, `(legal)/*`, `src/lib/legal/markdown.tsx`

- [ ] Allowlist `isLegalRoute` para anônimo, logado sem acesso e logado com acesso
- [ ] Layout `(legal)` + páginas que leem markdown
- [ ] Parser mínimo (`#`, `##`, `- `, parágrafos, `[t](u)`)

### Task 2: Conteúdo + links

- [ ] Escrever `content/legal/privacidade.md` e `termos.md`
- [ ] Links no footer da LP, login e `/assinar`

### Task 3: Exclusão de conta

- [ ] `POST /api/conta/excluir`: rate limit, auth, cancel Stripe, delete series→treino_exercicios→treinos→exercicios→profiles→`deleteUser`
- [ ] AccountSheet: bloco destrutivo dois toques → fetch → signOut → `/`

### Task 4: Docs internos

- [ ] `docs/lgpd/mapa-dados.md`, `incidente.md`
- [ ] Seção curta no Cérebro apontando para eles
- [ ] Atualizar status da spec para aprovado/implementando

### Task 5: Verificação

- [ ] lint, tsc, build
- [ ] Confirmar depoimentos já ilustrativos (já feito)
