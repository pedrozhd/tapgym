# Exportar Meu Treino em PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Botão em Meu Treino que baixa um PDF com todos os treinos em blocos e recordes de carga/reps por exercício.

**Architecture:** Helper puro monta a estrutura a partir do store; `jspdf` renderiza e dispara download no client. Sem API nova.

**Tech Stack:** Next.js client component, `jspdf`, store existente (`treinos`, `treinoExercicios`, `exercicios`, `series`).

**Spec:** `docs/superpowers/specs/2026-08-10-exportar-treino-pdf-design.md`

## Global Constraints

- Um PDF com todos os treinos; blocos por `ordem` / nome.
- Recordes de sempre independentes (carga e reps) com data; empate → série mais recente.
- Sem treinos → botão não renderiza.
- Sem série → “sem recorde ainda”.
- Botão outline, não compete com “+ Adicionar treino”.
- Sem suíte de testes no repo: verificar com `tsc` / `lint` / `build`.

---

## Task 1: Dep + helper de dados/PDF

- [x] `npm install jspdf`
- [x] Criar `src/lib/export-treino-pdf.ts`:
  - `montarBlocosExport(...)` — recordes + estrutura
  - `exportarTreinosPdf(...)` — jspdf + `save("tapgym-treinos.pdf")`
- [x] `npx tsc --noEmit`

## Task 2: Botão na página Meu Treino

- [x] Em `src/app/(app)/treino/page.tsx`: ler `series`, botão “Exportar PDF” (só se há treinos), estado gerando/erro
- [x] `npm run lint` + `npx tsc --noEmit` + `npm run build`
- [ ] Commit
