# Seed treino + modal atalho — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Conta nova nasce com Peito/Perna seedados; no iOS o ShortcutDialog abre sozinho no 1º dashboard.

**Architecture:** Seed no trigger `handle_new_user` (mesmo padrão do trial). Auto-open do diálogo no `AtalhoCard` com chave `localStorage` própria.

**Tech Stack:** Postgres/plpgsql (Supabase), React client component existente.

---

### Task 1: Migração SQL + schema.sql

**Files:**
- Create: `supabase/migrations/0015_seed_treino_inicial.sql`
- Modify: `supabase/schema.sql` (`handle_new_user`)

Substituir `handle_new_user` para, após o insert em `profiles`, inserir treinos/exercícios/`treino_exercicios` conforme a spec.

**Done when:** SQL aplica sem erro; conta de teste no SQL Editor / signup local vê 2 treinos.

### Task 2: Auto-open ShortcutDialog

**Files:**
- Modify: `src/components/dashboard/atalho-card.tsx`

Ao montar em iOS com convite não dispensado e modal ainda não visto: `setDialogoAberto(true)` + gravar `tapgym-atalho-modal-visto`.

### Task 3: Cérebro + verificação

**Files:**
- Modify: `docs/CEREBRO.md` (seção onboarding do atalho + menção ao seed)

`npx tsc --noEmit`. Commit.
