# Volume de séries semanal por grupamento muscular — Design

Data: 2026-07-24
Status: aprovado (design), aguardando revisão da spec

## Objetivo

Mostrar no dashboard quantas séries o usuário registrou nesta semana, agrupadas
por grupamento muscular (ombros, costas, peito, etc.), para enxergar o
equilíbrio do volume sem precisar de planilha.

## Decisões (fechadas no brainstorming)

1. **Um exercício = um grupamento.** Séries de Supino contam só para Peito,
   mesmo que o tríceps participe do movimento. Sem secundários no v1.
2. **Grupamento obrigatório no fluxo de cadastro, editável depois.** O
   exercício continua podendo nascer “em branco” (padrão atual do
   `addExercicioATreino`), mas o seletor de grupamento fica na mesma linha
   de edição em `/treino` e o usuário preenche junto com o nome.
3. **Exercícios antigos:** `grupo_muscular = null`. Suas séries **não entram**
   no volume semanal até o usuário classificar. Sem bloqueio forçado.
4. **UI do card:** lista vertical só dos grupamentos com `series > 0` nesta
   semana, ordenada do maior para o menor.
5. **Abordagem técnica:** coluna `grupo_muscular` em `exercicios` + função
   pura no client (`getVolumeSeriesPorGrupo`) + SoftCard no dashboard. Sem
   tabela N:N e sem inferência por nome.

## Modelo de dados

Migração `supabase/migrations/0009_grupo_muscular.sql`:

```sql
alter table public.exercicios
  add column if not exists grupo_muscular text
  check (
    grupo_muscular is null
    or grupo_muscular in (
      'ombros',
      'costas',
      'peito',
      'triceps',
      'biceps',
      'antebraco',
      'panturrilha',
      'abdomen',
      'gluteo',
      'posterior_de_coxa',
      'quadriceps',
      'trapezio',
      'adutores'
    )
  );
```

- Nullable de propósito (legado + exercício recém-criado ainda sem escolha).
- Check constraint garante o catálogo fechado; labels amigáveis ficam no TS.

### TypeScript

Em `src/lib/types.ts`:

```ts
export type GrupoMuscular =
  | "ombros"
  | "costas"
  | "peito"
  | "triceps"
  | "biceps"
  | "antebraco"
  | "panturrilha"
  | "abdomen"
  | "gluteo"
  | "posterior_de_coxa"
  | "quadriceps"
  | "trapezio"
  | "adutores";

export interface Exercicio {
  id: string;
  user_id: string;
  nome: string;
  grupo_muscular: GrupoMuscular | null;
  created_at: string;
}

export interface VolumeGrupoSemana {
  grupo: GrupoMuscular;
  series: number;
}
```

Catálogo de labels (ex. em `src/lib/grupos-musculares.ts`):

| valor | label |
|---|---|
| ombros | Ombros |
| costas | Costas |
| peito | Peito |
| triceps | Tríceps |
| biceps | Bíceps |
| antebraco | Antebraço |
| panturrilha | Panturrilha |
| abdomen | Abdômen |
| gluteo | Glúteo |
| posterior_de_coxa | Posterior de coxa |
| quadriceps | Quadríceps |
| trapezio | Trapézio |
| adutores | Adutores |

## Cadastro e edição

### Onde

`TreinoExercicioRow` em `/treino` — terceira linha da row (abaixo de séries/reps):

- Select / trigger com label do grupamento atual, ou placeholder
  “Escolher grupamento” quando `null`.
- Trocar o valor chama `updateGrupoMuscular(exercicioId, grupo)`.
- Exercício compartilhado entre treinos: o campo é do `exercicios`, então a
  mudança vale para todos os vínculos (mesmo comportamento do `nome`).

### Store

Em `src/lib/store.tsx`:

```ts
updateGrupoMuscular: (exercicioId: string, grupo: GrupoMuscular) => Promise<void>;
```

Implementação: `supabase.from("exercicios").update({ grupo_muscular: grupo })`
+ `refresh()`, espelhando `renameExercicio`.

### Fora de escopo no v1

- Não bloquear registro de série se `grupo_muscular` for null.
- Não forçar wizard/passe de classificação em massa no dashboard.
- Sem edição de grupamento na página `/exercicio/[id]` (pode vir depois; o
  caminho canônico no v1 é `/treino`).

## Métrica

Nova função pura em `src/lib/dashboard.ts`:

```ts
getVolumeSeriesPorGrupo(
  series: Serie[],
  exercicios: Exercicio[],
  data: Date = new Date(),
): { volumes: VolumeGrupoSemana[]; exerciciosSemGrupo: number }
```

Regras:

1. Semana = segunda → domingo no fuso do app (`APP_TIMEZONE`), reutilizando
   o helper de início de semana já usado por `getVolumeSemanal`.
2. Filtrar séries cuja `data` (convertida para dia local) cai na semana atual.
3. Resolver `exercicio_id → grupo_muscular`. Se `null`, a série não conta;
   incrementa `exerciciosSemGrupo` (contagem distinta de exercícios, não de
   séries).
4. Contar 1 por row em `series` (não tonelagem `carga × reps`).
5. Retornar só grupamentos com `series > 0`, ordenados por `series` desc;
   empate por ordem estável do catálogo.

`DashboardVM` ganha:

```ts
volumeSeriesPorGrupo: VolumeGrupoSemana[];
exerciciosSemGrupo: number;
```

A tonelagem histórica (`volumeSemanal` / `getVolumeSemanal`) permanece como
está (ainda sem card na UI) — não misturar as duas métricas.

## UI do dashboard

Novo componente `src/components/dashboard/volume-series-por-grupo-card.tsx`:

- SoftCard com eyebrow “Volume semanal” e título “Séries por grupamento”.
- Lista: `Peito` à esquerda, `12` à direita (tipografia alinhada aos outros
  cards do dashboard).
- Estado vazio: “Nenhuma série com grupamento esta semana.”
- Se `exerciciosSemGrupo > 0`: linha discreta
  “N exercícios sem grupamento” (singular/plural).
- Sem gráficos no v1.

### Posição em `dashboard/page.tsx`

- **Com treino hoje:** depois da grade de exercícios (`ExercicioGrid`), antes
  do rodapé implícito da página.
- **Dia de descanso:** depois do soft-card de descanso / `ExercicioMaisEvoluidoCard`.

## Fluxo de dados

```
series + exercicios (store)
        ↓
getVolumeSeriesPorGrupo()
        ↓
DashboardVM.volumeSeriesPorGrupo
        ↓
VolumeSeriesPorGrupoCard
```

Tudo no client, no mesmo padrão do restante do dashboard. Sem endpoint novo.

## Erros e edge cases

| Caso | Comportamento |
|---|---|
| Exercício sem grupo | Séries ignoradas no volume; aviso no card |
| Semana sem séries | Estado vazio do card |
| Só séries sem grupo | Estado vazio + aviso “N exercícios sem grupamento” |
| Troca de grupamento no meio da semana | Séries já registradas passam a contar no novo grupo (campo no exercício, não snapshot na série) |
| Valor inválido no DB | Check constraint rejeita no write |

## Testes

Função pura `getVolumeSeriesPorGrupo` (unitários em `src/lib/dashboard.test.ts`
ou arquivo irmão, seguindo o padrão existente):

- Semana atual conta; semana anterior não.
- Exercício null não entra; `exerciciosSemGrupo` correto.
- Ordenação desc; empate estável.
- Conta séries individuais (3 séries no mesmo dia = 3).

## Fora de escopo

- Grupamentos secundários / double-counting.
- Metas semanais por músculo (ex.: “peito 10+”).
- Histórico de semanas anteriores no card (só semana corrente).
- Tonelagem por grupamento.
- Inferência automática pelo nome do exercício.
- Subdomínio / app separado para marketing (irrelevante a esta feature).
