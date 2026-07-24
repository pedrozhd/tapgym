# Volume de séries por grupamento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir classificar cada exercício com um grupamento muscular e mostrar no dashboard a contagem de séries da semana atual por grupamento.

**Architecture:** Coluna nullable `grupo_muscular` em `exercicios` (catálogo fechado). Catálogo + labels em `src/lib/grupos-musculares.ts`. Função pura `getVolumeSeriesPorGrupo` em `dashboard.ts` alimenta o SoftCard novo. Edição do grupamento na row de `/treino` via `updateGrupoMuscular` no store.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Supabase (Postgres + client JS), SoftCard / TypographyEyebrow existentes. Sem framework de testes no projeto.

## Global Constraints

- Sem runner de teste no `package.json` — **não** introduzir Vitest/Jest. Verificação via `npx tsc --noEmit`, `npm run lint`, revisão da lógica pura e checklist manual no fim.
- "Hoje" / "esta semana" sempre via `getDataLocalISO(..., APP_TIMEZONE)` e `inicioDaSemana` já existente em `dashboard.ts` — nunca `Date` local do runtime nem `toISOString().slice(0,10)` direto na data do usuário.
- Um exercício = um grupamento. Sem secundários. Séries de exercício com `grupo_muscular = null` não entram no volume.
- Contagem = número de rows em `series` (não tonelagem `carga × reps`). Não misturar com `getVolumeSemanal`.
- Semana = segunda → domingo (mesma regra de `inicioDaSemana`).
- Todo texto de UI e comentários em pt-BR.
- Commits frequentes, um por task.
- Não editar `grupo_muscular` em `/exercicio/[id]` no v1 (só `/treino`).

## File structure

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0009_grupo_muscular.sql` | Coluna + check constraint |
| `supabase/schema.sql` | Espelhar coluna no schema canônico |
| `src/lib/types.ts` | `GrupoMuscular`, campo em `Exercicio`, `VolumeGrupoSemana` |
| `src/lib/grupos-musculares.ts` | Catálogo ordenado + labels |
| `src/lib/mock-data.ts` | Preencher `grupo_muscular` nos mocks |
| `src/lib/dashboard.ts` | `getVolumeSeriesPorGrupo` + campos no `DashboardVM` |
| `src/lib/store.tsx` | `updateGrupoMuscular` |
| `src/components/treino/treino-exercicio-row.tsx` | Select de grupamento |
| `src/components/treino/sortable-treino-exercicio-row.tsx` | Repassar props |
| `src/components/treino/treino-dia-card.tsx` | Wiring do callback |
| `src/app/(app)/treino/page.tsx` | Ligar store → card |
| `src/components/dashboard/volume-series-por-grupo-card.tsx` | SoftCard da lista |
| `src/app/(app)/dashboard/page.tsx` | Render do card |

---

### Task 1: Schema, types e catálogo

**Files:**
- Create: `supabase/migrations/0009_grupo_muscular.sql`
- Modify: `supabase/schema.sql` (tabela `exercicios`, ~linhas 7–12)
- Modify: `src/lib/types.ts`
- Create: `src/lib/grupos-musculares.ts`
- Modify: `src/lib/mock-data.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores
- Produces: tipo `GrupoMuscular`; `Exercicio.grupo_muscular: GrupoMuscular | null`; `VolumeGrupoSemana`; `GRUPOS_MUSCULARES: readonly GrupoMuscular[]`; `LABEL_GRUPO_MUSCULAR: Record<GrupoMuscular, string>`; coluna no DB

- [ ] **Step 1: Criar a migração**

Criar `supabase/migrations/0009_grupo_muscular.sql` com exatamente:

```sql
-- Grupamento muscular principal de cada exercício (nullable = legado / ainda não classificado).
alter table public.exercicios
  add column if not exists grupo_muscular text;

alter table public.exercicios
  drop constraint if exists exercicios_grupo_muscular_check;

alter table public.exercicios
  add constraint exercicios_grupo_muscular_check check (
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

(Nota: `add column if not exists` + `drop/add constraint` separados deixa a migração reexecutável sem falhar se a coluna já existir.)

- [ ] **Step 2: Atualizar `schema.sql`**

Na definição de `public.exercicios`, trocar o bloco da tabela por:

```sql
create table if not exists public.exercicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  grupo_muscular text check (
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
  ),
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: Atualizar `src/lib/types.ts`**

No topo do arquivo (antes de `export type Qualidade`), adicionar:

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
```

Atualizar `Exercicio`:

```ts
export interface Exercicio {
  id: string;
  user_id: string;
  nome: string;
  /** Null = legado ou exercício recém-criado ainda sem classificação. */
  grupo_muscular: GrupoMuscular | null;
  created_at: string;
}
```

Após `VolumeSemana`, adicionar:

```ts
export interface VolumeGrupoSemana {
  grupo: GrupoMuscular;
  series: number;
}
```

- [ ] **Step 4: Criar `src/lib/grupos-musculares.ts`**

```ts
import type { GrupoMuscular } from "@/lib/types";

/** Ordem canônica do catálogo — também usada como desempate estável no ranking. */
export const GRUPOS_MUSCULARES = [
  "ombros",
  "costas",
  "peito",
  "triceps",
  "biceps",
  "antebraco",
  "panturrilha",
  "abdomen",
  "gluteo",
  "posterior_de_coxa",
  "quadriceps",
  "trapezio",
  "adutores",
] as const satisfies readonly GrupoMuscular[];

export const LABEL_GRUPO_MUSCULAR: Record<GrupoMuscular, string> = {
  ombros: "Ombros",
  costas: "Costas",
  peito: "Peito",
  triceps: "Tríceps",
  biceps: "Bíceps",
  antebraco: "Antebraço",
  panturrilha: "Panturrilha",
  abdomen: "Abdômen",
  gluteo: "Glúteo",
  posterior_de_coxa: "Posterior de coxa",
  quadriceps: "Quadríceps",
  trapezio: "Trapézio",
  adutores: "Adutores",
};
```

- [ ] **Step 5: Atualizar mocks**

Em `src/lib/mock-data.ts`, em cada item de `mockExercicios`, adicionar `grupo_muscular`:

```ts
export const mockExercicios: Exercicio[] = [
  { id: "ex-supino", user_id: MOCK_USER_ID, nome: "Supino Reto", grupo_muscular: "peito", created_at: isoDaysAgo(120) },
  { id: "ex-desenvolvimento", user_id: MOCK_USER_ID, nome: "Desenvolvimento com Halteres", grupo_muscular: "ombros", created_at: isoDaysAgo(120) },
  { id: "ex-triceps-corda", user_id: MOCK_USER_ID, nome: "Tríceps Corda", grupo_muscular: "triceps", created_at: isoDaysAgo(120) },
  { id: "ex-puxada", user_id: MOCK_USER_ID, nome: "Puxada Frente", grupo_muscular: "costas", created_at: isoDaysAgo(120) },
  { id: "ex-remada-baixa", user_id: MOCK_USER_ID, nome: "Remada Baixa", grupo_muscular: "costas", created_at: isoDaysAgo(120) },
  { id: "ex-rosca-direta", user_id: MOCK_USER_ID, nome: "Rosca Direta", grupo_muscular: "biceps", created_at: isoDaysAgo(120) },
  { id: "ex-agachamento", user_id: MOCK_USER_ID, nome: "Agachamento Livre", grupo_muscular: "quadriceps", created_at: isoDaysAgo(120) },
  { id: "ex-leg-press", user_id: MOCK_USER_ID, nome: "Leg Press", grupo_muscular: "quadriceps", created_at: isoDaysAgo(120) },
  { id: "ex-cadeira-extensora", user_id: MOCK_USER_ID, nome: "Cadeira Extensora", grupo_muscular: "quadriceps", created_at: isoDaysAgo(120) },
];
```

- [ ] **Step 6: Verificar TypeScript**

Run: `npx tsc --noEmit`

Expected: erros só onde `Exercicio` literais ainda não têm `grupo_muscular` (se houver outros além do mock — corrigir no mesmo espírito). Se o único consumidor era o mock e ele já foi atualizado, deve passar (ou falhar só em lugares ainda não atualizados das tasks seguintes — ok se for só `dashboard`/`store` ainda sem o campo em inserts; inserts `{ nome: "" }` do store ainda compilam porque `grupo_muscular` é opcional no insert do Supabase, mas o tipo `Exercicio` exige o campo nos objetos tipados).

Se `tsc` reclamar de objetos `Exercicio` sem o campo, corrija antes do commit.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/0009_grupo_muscular.sql supabase/schema.sql src/lib/types.ts src/lib/grupos-musculares.ts src/lib/mock-data.ts
git commit -m "$(cat <<'EOF'
Adiciona grupo_muscular em exercicios com catálogo fixo.

EOF
)"
```

(No PowerShell do Windows, use o equivalente já usado no repo: `git commit -m "$(@' ... '@)"`.)

---

### Task 2: `getVolumeSeriesPorGrupo` + `DashboardVM`

**Files:**
- Modify: `src/lib/dashboard.ts`

**Interfaces:**
- Consumes: `GrupoMuscular`, `VolumeGrupoSemana`, `Exercicio` de `@/lib/types`; `GRUPOS_MUSCULARES` de `@/lib/grupos-musculares`; `inicioDaSemana` (privada no mesmo arquivo); `getDataLocalISO`, `APP_TIMEZONE`
- Produces: `getVolumeSeriesPorGrupo(series, exercicios, data?): { volumes: VolumeGrupoSemana[]; exerciciosSemGrupo: number }`; `DashboardVM.volumeSeriesPorGrupo` e `DashboardVM.exerciciosSemGrupo`

- [ ] **Step 1: Ler o arquivo e confirmar âncoras**

Abra `src/lib/dashboard.ts`. Confirme:
- `inicioDaSemana` existe (~linha 85)
- `getVolumeSemanal` existe logo depois
- `DashboardVM` e `getDashboardData` no final

- [ ] **Step 2: Atualizar imports**

No topo de `dashboard.ts`, ajustar imports:

```ts
import { APP_TIMEZONE, getDataLocalISO, getDiaSemanaNoFuso } from "@/lib/timezone";
import { GRUPOS_MUSCULARES } from "@/lib/grupos-musculares";
import type {
  Exercicio,
  Qualidade,
  Serie,
  Tendencia,
  Treino,
  TreinoExercicio,
  VolumeGrupoSemana,
  VolumeSemana,
} from "@/lib/types";
```

- [ ] **Step 3: Inserir `getVolumeSeriesPorGrupo` logo após `getVolumeSemanal`**

Logo depois do fechamento de `getVolumeSemanal` (antes de `shouldSugerirProgressao`), inserir:

```ts
/**
 * Séries registradas na semana civil atual (seg–dom, fuso do app), agrupadas
 * pelo grupamento principal do exercício. Exercícios sem grupo não entram
 * em `volumes`; entram em `exerciciosSemGrupo` (IDs distintos com série na
 * semana e grupo null).
 */
export function getVolumeSeriesPorGrupo(
  series: Serie[],
  exercicios: Exercicio[],
  data: Date = new Date(),
): { volumes: VolumeGrupoSemana[]; exerciciosSemGrupo: number } {
  const semanaAtual = inicioDaSemana(getDataLocalISO(data, APP_TIMEZONE));
  const grupoPorExercicio = new Map(exercicios.map((e) => [e.id, e.grupo_muscular] as const));

  const contagem = new Map<GrupoMuscular, number>();
  const semGrupo = new Set<string>();

  for (const s of series) {
    if (inicioDaSemana(s.data) !== semanaAtual) continue;
    const grupo = grupoPorExercicio.get(s.exercicio_id) ?? null;
    if (!grupo) {
      semGrupo.add(s.exercicio_id);
      continue;
    }
    contagem.set(grupo, (contagem.get(grupo) ?? 0) + 1);
  }

  const ordemCatalogo = new Map(GRUPOS_MUSCULARES.map((g, i) => [g, i]));
  const volumes = [...contagem.entries()]
    .map(([grupo, seriesCount]) => ({ grupo, series: seriesCount }))
    .sort(
      (a, b) =>
        b.series - a.series ||
        (ordemCatalogo.get(a.grupo) ?? 0) - (ordemCatalogo.get(b.grupo) ?? 0),
    );

  return { volumes, exerciciosSemGrupo: semGrupo.size };
}
```

Também importe o tipo `GrupoMuscular` no import de types (ou use inferência via Map — se o Map precisar do tipo explícito):

```ts
import type {
  Exercicio,
  GrupoMuscular,
  Qualidade,
  Serie,
  Tendencia,
  Treino,
  TreinoExercicio,
  VolumeGrupoSemana,
  VolumeSemana,
} from "@/lib/types";
```

- [ ] **Step 4: Estender `DashboardVM` e `getDashboardData`**

Atualizar a interface:

```ts
export interface DashboardVM {
  treino: { id: string; nome: string; totalExercicios: number } | null;
  exercicios: DashboardExercicioVM[];
  volumeSemanal: VolumeSemana[];
  volumeSeriesPorGrupo: VolumeGrupoSemana[];
  exerciciosSemGrupo: number;
  exercicioMaisEvoluido: ExercicioEvolucao | null;
  exercicioEmFoco: ExercicioEmFoco | null;
}
```

No início de `getDashboardData`, depois de obter `treinoDeHoje`, calcule uma vez:

```ts
  const { volumes: volumeSeriesPorGrupo, exerciciosSemGrupo } = getVolumeSeriesPorGrupo(
    series,
    exercicios,
    data,
  );
```

No return quando `!treinoDeHoje`, inclua:

```ts
      volumeSeriesPorGrupo,
      exerciciosSemGrupo,
```

No return com treino, inclua os mesmos dois campos.

- [ ] **Step 5: Verificar TypeScript**

Run: `npx tsc --noEmit`

Expected: PASS (ou só erros fora deste escopo).

Checklist mental da função (revisar no código):
1. 3 séries no mesmo dia do mesmo exercício com grupo = 3 no contador.
2. Série de semana anterior não entra.
3. Exercício `grupo_muscular: null` incrementa `exerciciosSemGrupo` e não aparece em `volumes`.
4. Empate de séries: ordem de `GRUPOS_MUSCULARES`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dashboard.ts
git commit -m "$(cat <<'EOF'
Calcula volume semanal de séries por grupamento muscular.

EOF
)"
```

---

### Task 3: Store `updateGrupoMuscular`

**Files:**
- Modify: `src/lib/store.tsx`

**Interfaces:**
- Consumes: `GrupoMuscular` de `@/lib/types`
- Produces: `updateGrupoMuscular: (exercicioId: string, grupo: GrupoMuscular) => Promise<void>` no contexto do store

- [ ] **Step 1: Atualizar imports do store**

Garantir que `GrupoMuscular` entra no import de types (junto com os tipos já usados).

- [ ] **Step 2: Declarar no tipo da API do store**

Na interface/tipo onde estão `renameExercicio`, `addExercicioATreino`, etc., adicionar:

```ts
  updateGrupoMuscular: (exercicioId: string, grupo: GrupoMuscular) => Promise<void>;
```

- [ ] **Step 3: Implementar espelhando `renameExercicio`**

Logo após `renameExercicio`, adicionar:

```ts
      async updateGrupoMuscular(exercicioId, grupo) {
        await supabase
          .from("exercicios")
          .update({ grupo_muscular: grupo })
          .eq("id", exercicioId)
          .throwOnError();
        await refresh();
      },
```

- [ ] **Step 4: Verificar TypeScript**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.tsx
git commit -m "$(cat <<'EOF'
Permite atualizar o grupamento muscular do exercício no store.

EOF
)"
```

---

### Task 4: Seletor de grupamento em `/treino`

**Files:**
- Modify: `src/components/treino/treino-exercicio-row.tsx`
- Modify: `src/components/treino/sortable-treino-exercicio-row.tsx`
- Modify: `src/components/treino/treino-dia-card.tsx`
- Modify: `src/app/(app)/treino/page.tsx`

**Interfaces:**
- Consumes: `updateGrupoMuscular` do store; `GrupoMuscular`; `GRUPOS_MUSCULARES`, `LABEL_GRUPO_MUSCULAR`
- Produces: UI editável de grupamento na row; callback `onGrupoMuscularChange`

- [ ] **Step 1: Atualizar `TreinoExercicioRow`**

Adicionar props:

```ts
  grupoMuscular: GrupoMuscular | null;
  onGrupoMuscularChange: (grupo: GrupoMuscular) => void;
```

Importar:

```ts
import { GRUPOS_MUSCULARES, LABEL_GRUPO_MUSCULAR } from "@/lib/grupos-musculares";
import type { GrupoMuscular } from "@/lib/types";
```

Na destruturação do componente, incluir `grupoMuscular` e `onGrupoMuscularChange`.

Após a linha de séries/reps (o `div` com `pl-[26px]`), **antes** do `RemoverExercicioDialog`, inserir:

```tsx
      <div className="pl-[26px]">
        <select
          aria-label="Grupamento muscular"
          value={grupoMuscular ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            onGrupoMuscularChange(value as GrupoMuscular);
          }}
          className="h-7 w-full max-w-[220px] rounded-md border border-input bg-secondary/60 px-2 text-[13px] text-foreground"
        >
          <option value="" disabled>
            Escolher grupamento
          </option>
          {GRUPOS_MUSCULARES.map((grupo) => (
            <option key={grupo} value={grupo}>
              {LABEL_GRUPO_MUSCULAR[grupo]}
            </option>
          ))}
        </select>
      </div>
```

- [ ] **Step 2: Repassar props em `SortableTreinoExercicioRow`**

Adicionar as mesmas props à interface (`grupoMuscular`, `onGrupoMuscularChange`) — o spread `{...rowProps}` já as entrega ao `TreinoExercicioRow` se estiverem na interface e forem passadas pelo pai. Atualize a interface:

```ts
  grupoMuscular: GrupoMuscular | null;
  onGrupoMuscularChange: (grupo: GrupoMuscular) => void;
```

Importar `GrupoMuscular` de `@/lib/types`.

- [ ] **Step 3: Wiring em `TreinoDiaCard`**

Adicionar prop:

```ts
  onGrupoMuscularChange: (exercicioId: string, grupo: GrupoMuscular) => void;
```

Importar `GrupoMuscular`. Desestruturar `onGrupoMuscularChange`. No `SortableTreinoExercicioRow`:

```tsx
                grupoMuscular={te.exercicio.grupo_muscular}
                onGrupoMuscularChange={(grupo) => onGrupoMuscularChange(te.exercicio_id, grupo)}
```

- [ ] **Step 4: Ligar na page `/treino`**

Em `src/app/(app)/treino/page.tsx`, incluir `updateGrupoMuscular` no destructuring de `useAppStore()` e passar:

```tsx
                onGrupoMuscularChange={updateGrupoMuscular}
```

para `TreinoDiaCard`.

- [ ] **Step 5: Verificar TypeScript + lint**

Run: `npx tsc --noEmit`

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/treino/treino-exercicio-row.tsx src/components/treino/sortable-treino-exercicio-row.tsx src/components/treino/treino-dia-card.tsx src/app/(app)/treino/page.tsx
git commit -m "$(cat <<'EOF'
Adiciona seletor de grupamento muscular na montagem do treino.

EOF
)"
```

---

### Task 5: Card no dashboard

**Files:**
- Create: `src/components/dashboard/volume-series-por-grupo-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `DashboardVM.volumeSeriesPorGrupo`, `DashboardVM.exerciciosSemGrupo`; `LABEL_GRUPO_MUSCULAR`; `VolumeGrupoSemana`
- Produces: `VolumeSeriesPorGrupoCard` renderizado nos dois estados do dashboard (treino / descanso)

- [ ] **Step 1: Criar o card**

Criar `src/components/dashboard/volume-series-por-grupo-card.tsx`:

```tsx
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import { LABEL_GRUPO_MUSCULAR } from "@/lib/grupos-musculares";
import type { VolumeGrupoSemana } from "@/lib/types";

interface Props {
  volumes: VolumeGrupoSemana[];
  exerciciosSemGrupo: number;
}

export function VolumeSeriesPorGrupoCard({ volumes, exerciciosSemGrupo }: Props) {
  return (
    <SoftCard className="flex flex-col gap-2.5 p-4">
      <div>
        <TypographyEyebrow>Volume semanal</TypographyEyebrow>
        <p className="mt-1 text-lg font-bold leading-none">Séries por grupamento</p>
      </div>

      {volumes.length === 0 ? (
        <TypographyMuted className="py-3 text-center">
          Nenhuma série com grupamento esta semana.
        </TypographyMuted>
      ) : (
        <ul className="flex flex-col gap-2">
          {volumes.map((item) => (
            <li key={item.grupo} className="flex items-center justify-between gap-3 text-[15px]">
              <span className="min-w-0 truncate font-medium">{LABEL_GRUPO_MUSCULAR[item.grupo]}</span>
              <span className="shrink-0 font-bold tabular-nums">{item.series}</span>
            </li>
          ))}
        </ul>
      )}

      {exerciciosSemGrupo > 0 && (
        <TypographyMuted>
          {exerciciosSemGrupo === 1
            ? "1 exercício sem grupamento"
            : `${exerciciosSemGrupo} exercícios sem grupamento`}
        </TypographyMuted>
      )}
    </SoftCard>
  );
}
```

- [ ] **Step 2: Plugar em `dashboard/page.tsx`**

Importar:

```ts
import { VolumeSeriesPorGrupoCard } from "@/components/dashboard/volume-series-por-grupo-card";
```

**Com treino hoje** — depois de `<ExercicioGrid ... />`:

```tsx
                    <VolumeSeriesPorGrupoCard
                      volumes={dashboard.volumeSeriesPorGrupo}
                      exerciciosSemGrupo={dashboard.exerciciosSemGrupo}
                    />
```

**Dia de descanso** — depois de `<ExercicioMaisEvoluidoCard ... />`:

```tsx
                    <VolumeSeriesPorGrupoCard
                      volumes={dashboard.volumeSeriesPorGrupo}
                      exerciciosSemGrupo={dashboard.exerciciosSemGrupo}
                    />
```

- [ ] **Step 3: Verificar build**

Run: `npx tsc --noEmit`

Run: `npm run lint`

Run: `npm run build`

Expected: build completa sem erros.

- [ ] **Step 4: Checklist manual (dev local)**

1. Rodar a migração `0009` no Supabase do ambiente de dev.
2. Em `/treino`, abrir um exercício e escolher “Peito” — recarregar e confirmar que o select mantém o valor.
3. Registrar séries em `/registro` para esse exercício.
4. No `/dashboard`, o card lista o grupamento com a contagem correta (1 por série).
5. Exercício sem grupamento: séries registradas não aparecem na lista; aviso “N exercício(s) sem grupamento” aparece.
6. Dia de descanso e dia com treino: card visível nos dois fluxos.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/volume-series-por-grupo-card.tsx src/app/(app)/dashboard/page.tsx
git commit -m "$(cat <<'EOF'
Mostra séries semanais por grupamento no dashboard.

EOF
)"
```

---

## Spec coverage (self-review)

| Requisito da spec | Task |
|---|---|
| Migração `grupo_muscular` + check | Task 1 |
| Types + labels dos 13 grupos | Task 1 |
| 1 exercício = 1 grupo | Tasks 1–4 |
| Exercícios antigos null / não contam | Tasks 1–2 |
| Seletor em `TreinoExercicioRow` | Task 4 |
| `updateGrupoMuscular` no store | Task 3 |
| `getVolumeSeriesPorGrupo` (seg–dom, count series) | Task 2 |
| Card lista só >0, ordenado desc | Tasks 2 + 5 |
| Aviso exercícios sem grupo | Task 5 |
| Posição dashboard treino/descanso | Task 5 |
| Sem secundários / sem tonelagem / sem `/exercicio/[id]` | Global Constraints |

**Placeholder scan:** nenhum TBD/TODO de implementação.
**Type consistency:** `GrupoMuscular`, `VolumeGrupoSemana`, `getVolumeSeriesPorGrupo`, `updateGrupoMuscular`, `VolumeSeriesPorGrupoCard` — nomes alinhados entre tasks.
