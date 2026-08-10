# Exportar Meu Treino em PDF — Design

Data: 2026-08-10  
Status: implementado

## Objetivo

Na aba **Meu Treino**, o usuário baixa um único `.pdf` com **todos os
treinos**, organizados em blocos pelo nome do treino. Para cada exercício:
prescrição (séries × faixa de reps) e **dois recordes de sempre separados**
— maior carga (com data) e maior repetição (com data). Serve para levar o
plano à academia, compartilhar com alguém ou ter um snapshot do progresso
sem abrir o app.

## Fora de escopo

- Export por treino individual (um PDF por card)
- Tour / indicadores de “clique aqui”
- Seed de treino exemplo (spec separada: `2026-07-29-seed-treino-onboarding-design.md`)
- Histórico completo de séries no PDF (só recordes + prescrição)
- Envio por e-mail / compartilhar nativo além do download do arquivo
- Tipografia editorial fancy ou branding pesado no PDF
- API server-side de geração de PDF

## Decisões

1. **Um PDF com todos os treinos**, não um por card.
2. **Blocos por nome do treino**, na mesma ordem da tela (`ordem`).
3. **Recordes de sempre**, por exercício:
   - maior `carga` em qualquer série do `exercicio_id`, com a `data` dessa série;
   - maior `reps` em qualquer série do mesmo exercício, com a `data` dessa série
     (e a carga da série que bateu o recorde de reps, para contexto).
4. Os dois recordes são **independentes** (podem ser em dias diferentes).
5. Exercício compartilhado entre treinos: o histórico é do exercício; o mesmo
   par de recordes aparece em cada bloco onde o exercício entra.
6. Geração **no cliente** a partir do store (já carrega `treinos`,
   `treinoExercicios`, `exercicios`, `series`). Sem rota nova.
7. Lib leve de PDF no browser (ex.: `jspdf`). Download direto
   (`tapgym-treinos.pdf` ou similar).
8. Botão único na página Meu Treino, abaixo da lista / junto de
   “+ Adicionar treino”. **Não renderiza** se `treinos.length === 0`
   (mesmo espírito do `SemanaCard`).
9. Sem série registrada no exercício: mostra só a prescrição e a linha
   “sem recorde ainda” (não inventa zero).

## Conteúdo do PDF

```
TapGym — Meu Treino
Gerado em DD/MM/AAAA

── {nome do treino} ─────────────────────
  {opcional: dias da semana, se houver}

  {nome do exercício}
    Prescrição: {num_series}× {rep_min}–{rep_max}
    Recorde carga: {carga} kg ({data})
    Recorde reps: {reps} reps ({data}) · {carga da série} kg

  …
── {próximo treino} ─────────────────────
  …
```

Regras de formatação:

- Datas em `pt-BR` (`DD/MM/AAAA`), timezone local do dispositivo.
- Carga com unidade `kg` (o app já trabalha em kg).
- Empate no recorde (mesma carga ou mesmas reps): usar a série **mais
  recente** (`data` desc, depois `id` se precisar).
- Treino sem nome (string vazia/whitespace): título fallback
  `"Treino {n}"` com `n = ordem + 1` (1-based na lista ordenada).
- Quebra de página automática entre exercícios/treinos conforme a lib;
  não forçar uma página por treino.

## UI

**Onde:** `src/app/(app)/treino/page.tsx` (Meu Treino).

**Controle:** botão secundário / outline (não compete com “+ Adicionar
treino”), texto **“Exportar PDF”**, ícone `Download` ou `FileDown`
(lucide). Full-width, `h-[52px] rounded-xl`, alinhado ao design system do
app — variante `outline` ou o mesmo peso visual do card de ação
secundária, não o CTA lime primário.

**Estados:**

| Estado | Comportamento |
| --- | --- |
| Sem treinos | Botão desabilitado ou não renderizado |
| Gerando | Label “Gerando…” / disabled até o download disparar |
| Erro | Toast ou texto breve; não travar a tela |

Não abrir dialog de opções nesta fase (só um download).

## Dados e cálculo

Fonte: `useAppStore()` — `treinos`, `treinoExercicios`, `exercicios`, `series`.

Para cada treino ordenado por `ordem`:

1. Filtrar `treinoExercicios` por `treino_id`, ordenar por `ordem`.
2. Resolver `exercicio` pelo `exercicio_id`.
3. Filtrar `series` pelo mesmo `exercicio_id`.
4. Recorde carga = `max(serie.carga)`; guardar `data` (e `reps` opcional) da série vencedora.
5. Recorde reps = `max(serie.reps)`; guardar `data` e `carga` da série vencedora.

Extrair o cálculo puro para um helper testável mentalmente
(`src/lib/export-treino-pdf.ts` ou similar): entrada = arrays do store;
saída = estrutura de blocos pronta para o renderer do PDF. A UI só chama
`exportarTreinosPdf(...)` e dispara o save.

## Dependências

- Nova dep de runtime: gerador PDF no client (candidato: `jspdf`).
- Sem mudança de schema Supabase, RLS ou middleware.
- Sem alteração em Cobrança / Cérebro além de eventual nota curta se
  quisermos documentar o botão (opcional; não bloqueia).

## Fluxo

```
Meu Treino (treinos.length > 0)
  → toque "Exportar PDF"
  → monta blocos + recordes no client
  → jspdf gera blob
  → download tapgym-treinos.pdf
```

## Critérios de aceite

1. Com 2+ treinos cadastrados e séries em pelo menos um exercício, o PDF
   baixa e lista cada treino como bloco com seus exercícios.
2. Recordes de carga e de reps aparecem com datas distintas quando as
   séries vencedoras forem de dias diferentes.
3. Exercício sem séries: prescrição ok + “sem recorde ainda”.
4. Lista vazia: botão não aparece; não há como gerar PDF.
5. Funciona em mobile Safari (iPhone) e Chrome desktop — download ou
   compartilhar do sistema, conforme o browser.

## Riscos / limitações aceitas

- Layout do PDF é utilitário, não marketing.
- Volume enorme de exercícios pode gerar PDF longo; aceitável na v1.
- Recordes usam todas as séries do exercício (não filtradas por treino),
  o que é correto porque a série não tem `treino_id`.
- Empates resolvidos pela data mais recente — documentado aqui; não
  expor escolha na UI.
