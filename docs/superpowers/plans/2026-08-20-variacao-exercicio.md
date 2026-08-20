# Variação de exercício — Implementation Plan

> **For agentic workers:** Implement task-by-task. Verificação do projeto: `npm run lint`, `npx tsc --noEmit` (não há suíte de testes). Commits só se o usuário pedir.

**Goal:** Exercício pai na ficha, variações em cascata, troca do dia no Registro/lápis, atalho mostrando `{pai} · {variação}` e última carga daquela variação.

**Architecture:** Catálogo em `exercicio_variacoes`; sessão em `exercicio_variacao_dia` (grão exercício + data civil). `series` não ganha coluna. `GET /api/hoje` só muda o valor de `nome` e `ultima_carga`.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), store client existente.

**Spec:** `docs/superpowers/specs/2026-08-20-variacao-exercicio-design.md`

## Global Constraints

- Sem campo novo obrigatório no POST `/api/registrar`; não renomear campos do atalho.
- Dia civil via `getDataLocalISO` / `America/Sao_Paulo`.
- Dark-only, alvos 44px, sem segundo ícone na row da série.
- SQL em `supabase/migrations/` precisa `git add -f` (gitignore).
- Observação do dia permanece feature à parte.

## Files

- Create: `supabase/migrations/0020_exercicio_variacoes.sql`
- Create: `supabase/migrations/0021_aviso_variacao_exercicio.sql`
- Create: `src/lib/variacao-exercicio.ts`
- Create: `src/components/treino/variacao-nome-dialog.tsx`
- Create: `src/components/registro/variacao-do-dia-control.tsx`
- Modify: `supabase/schema.sql`, `src/lib/types.ts`, `src/lib/store.tsx`
- Modify: adicionar-exercicio-dialog, treino-exercicio-row, sortable row, treino-dia-card, treino/page
- Modify: editar-serie-dialog, registro/page, exercicio/[id]/page
- Modify: `src/app/api/hoje/route.ts`, `src/app/api/conta/excluir/route.ts`
- Modify: `docs/CEREBRO.md` §7 (semântica de `nome` / `ultima_carga`)
- Modify: spec status → implementado (ao terminar)

## Tasks

1. SQL + types
2. Helpers + store (CRUD variação, setVariacaoDoDia, fetch)
3. Cascata Meu Treino / Adicionar exercício
4. Controle Hoje no Registro + lápis
5. Histórico (rótulo + chips)
6. `/api/hoje` + exclusão de conta
7. Aviso + CEREBRO
8. lint + tsc

Não commitir automaticamente.
