# Seed de treino + onboarding do atalho

Data: 2026-07-29  
Status: aprovado para implementação

## Problema

Conta nova cai no dashboard vazio (“Nenhum treino cadastrado”). Nos 7 dias de trial a pessoa ainda precisa montar tudo antes de registrar a primeira série. O atalho iOS só era descoberto depois de treino + clique no card.

## Decisão

1. **Seed no `handle_new_user`** (SQL, `security definer`): junto com profile + trial, criar 2 treinos com exercícios e dias.
2. **Modal do atalho abre sozinho** no primeiro dashboard em iOS (sem esperar clique no card).

## Seed

| Treino | `dias_semana` | Exercícios (3×8–12, grupo) |
| --- | --- | --- |
| Peito | `{1,4}` (seg, qui) | Supino reto (peito), Supino inclinado (peito), Crucifixo (peito), Tríceps pulley (triceps) |
| Perna | `{2,5}` (ter, sex) | Agachamento (quadriceps), Leg press (quadriceps), Cadeira extensora (quadriceps), Mesa flexora (posterior_de_coxa), Panturrilha (panturrilha) |

- Sem séries (carga no primeiro registro).
- Só contas **novas** — sem backfill de contas já existentes vazias.
- Lista é exemplo editável; a pessoa pode apagar/renomear em Meu Treino.

## Modal do atalho (iOS)

- Com treino seedado, o empty state some e o `AtalhoCard` pode renderizar.
- Na primeira visita ao dashboard em iOS, se o convite ainda não foi dispensado, o `ShortcutDialog` **abre automaticamente**.
- Chave `localStorage` separada (`tapgym-atalho-modal-visto`) evita reabrir a cada refresh sem dispensar o card.
- “Depois” no card continua gravando `tapgym-atalho-dispensado` e esconde card + auto-open.
- Fora do iOS: sem modal, sem card (inalterado).

## Fora de escopo

- Backfill de contas antigas vazias.
- Mudança na LP ou no fluxo interno do atalho iCloud.
- Templates adicionais (PPL, full body, etc.).

## Arquivos

- `supabase/migrations/0015_seed_treino_inicial.sql` + sync em `supabase/schema.sql`
- `src/components/dashboard/atalho-card.tsx`
- Ponte em `docs/CEREBRO.md` (onboarding)
