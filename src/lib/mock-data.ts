import type {
  Exercicio,
  Qualidade,
  Serie,
  Treino,
  TreinoExercicio,
} from "@/lib/types";

/**
 * Mocked data standing in for Supabase tables while the Dashboard is built
 * screen-first. Shapes mirror `supabase/schema.sql` exactly so swapping in
 * real queries later is a drop-in replacement.
 */

const MOCK_USER_ID = "00000000-0000-0000-0000-000000000001";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// Agenda de exemplo: Push na segunda/quinta, Pull na terça/sexta, Legs na quarta/sábado, domingo de descanso.
export const mockTreinos: Treino[] = [
  { id: "treino-push", user_id: MOCK_USER_ID, nome: "Push", ordem: 0, dias_semana: [1, 4], created_at: isoDaysAgo(120) },
  { id: "treino-pull", user_id: MOCK_USER_ID, nome: "Pull", ordem: 1, dias_semana: [2, 5], created_at: isoDaysAgo(120) },
  { id: "treino-legs", user_id: MOCK_USER_ID, nome: "Legs", ordem: 2, dias_semana: [3, 6], created_at: isoDaysAgo(120) },
];

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

export const mockTreinoExercicios: TreinoExercicio[] = [
  { id: "te-1", treino_id: "treino-push", exercicio_id: "ex-supino", ordem: 0, num_series: 4, rep_min: 6, rep_max: 10, created_at: isoDaysAgo(120) },
  { id: "te-2", treino_id: "treino-push", exercicio_id: "ex-desenvolvimento", ordem: 1, num_series: 3, rep_min: 8, rep_max: 12, created_at: isoDaysAgo(120) },
  { id: "te-3", treino_id: "treino-push", exercicio_id: "ex-triceps-corda", ordem: 2, num_series: 3, rep_min: 10, rep_max: 15, created_at: isoDaysAgo(120) },

  { id: "te-4", treino_id: "treino-pull", exercicio_id: "ex-puxada", ordem: 0, num_series: 4, rep_min: 6, rep_max: 10, created_at: isoDaysAgo(120) },
  { id: "te-5", treino_id: "treino-pull", exercicio_id: "ex-remada-baixa", ordem: 1, num_series: 3, rep_min: 8, rep_max: 12, created_at: isoDaysAgo(120) },
  { id: "te-6", treino_id: "treino-pull", exercicio_id: "ex-rosca-direta", ordem: 2, num_series: 3, rep_min: 10, rep_max: 15, created_at: isoDaysAgo(120) },

  { id: "te-7", treino_id: "treino-legs", exercicio_id: "ex-agachamento", ordem: 0, num_series: 4, rep_min: 6, rep_max: 10, created_at: isoDaysAgo(120) },
  { id: "te-8", treino_id: "treino-legs", exercicio_id: "ex-leg-press", ordem: 1, num_series: 3, rep_min: 8, rep_max: 12, created_at: isoDaysAgo(120) },
  { id: "te-9", treino_id: "treino-legs", exercicio_id: "ex-cadeira-extensora", ordem: 2, num_series: 3, rep_min: 10, rep_max: 15, created_at: isoDaysAgo(120) },
];

/**
 * Builds a series history spaced `intervalDays` apart. `lastEntryDaysAgo`
 * anchors the most recent entry — exercises from the same treino share it
 * (they're trained together), while different treinos are offset so the
 * Push/Pull/Legs rotation in `getTreinoDeHoje` has something real to pick from.
 */
function buildSeries(
  exercicioId: string,
  entries: Array<[carga: number, reps: number, qualidade: Qualidade]>,
  { intervalDays = 5, lastEntryDaysAgo = 0 }: { intervalDays?: number; lastEntryDaysAgo?: number } = {},
): Serie[] {
  const total = entries.length;
  return entries.map(([carga, reps, qualidade], i) => ({
    id: `${exercicioId}-s${i}`,
    exercicio_id: exercicioId,
    carga,
    reps,
    qualidade,
    data: isoDaysAgo(lastEntryDaysAgo + (total - 1 - i) * intervalDays),
  }));
}

// Histórico simulado só para os gráficos de tendência/volume — "treino de hoje"
// é decidido pela agenda semanal (dias_semana) acima, não por este histórico.
const PUSH_LAST_DAYS_AGO = 4;
const PULL_LAST_DAYS_AGO = 2;
const LEGS_LAST_DAYS_AGO = 0;

export const mockSeries: Serie[] = [
  ...buildSeries(
    "ex-supino",
    [
      [40, 8, "boa"], [40, 9, "boa"], [42.5, 8, "boa"], [42.5, 9, "boa"],
      [45, 8, "boa"], [45, 9, "razoavel"], [47.5, 9, "boa"], [50, 8, "boa"],
    ],
    { lastEntryDaysAgo: PUSH_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-desenvolvimento",
    [
      [16, 10, "boa"], [16, 11, "boa"], [18, 9, "boa"], [18, 10, "boa"],
      [18, 12, "boa"], [20, 8, "razoavel"], [20, 9, "boa"], [20, 10, "boa"],
    ],
    { lastEntryDaysAgo: PUSH_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-triceps-corda",
    [
      [20, 12, "boa"], [22.5, 11, "boa"], [22.5, 13, "boa"], [25, 10, "boa"],
      [25, 11, "razoavel"], [25, 12, "boa"], [25, 12, "boa"], [25, 13, "ruim"],
    ],
    { lastEntryDaysAgo: PUSH_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-puxada",
    [
      [45, 8, "boa"], [47.5, 7, "boa"], [47.5, 8, "boa"], [50, 7, "boa"],
      [50, 8, "boa"], [52.5, 7, "boa"], [55, 6, "boa"], [55, 8, "boa"],
    ],
    { lastEntryDaysAgo: PULL_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-remada-baixa",
    [
      [40, 10, "boa"], [40, 11, "boa"], [42.5, 9, "boa"], [42.5, 10, "boa"],
      [45, 9, "razoavel"], [45, 9, "boa"], [45, 10, "boa"], [45, 10, "boa"],
    ],
    { lastEntryDaysAgo: PULL_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-rosca-direta",
    [
      [12, 12, "boa"], [12, 13, "boa"], [14, 11, "boa"], [14, 12, "boa"],
      [14, 14, "boa"], [16, 10, "boa"], [16, 11, "razoavel"], [18, 10, "boa"],
    ],
    { lastEntryDaysAgo: PULL_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-agachamento",
    [
      [60, 8, "boa"], [60, 9, "boa"], [65, 8, "boa"], [65, 9, "boa"],
      [70, 7, "boa"], [70, 8, "boa"], [75, 7, "boa"], [80, 6, "boa"],
    ],
    { lastEntryDaysAgo: LEGS_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-leg-press",
    [
      [120, 10, "boa"], [130, 9, "boa"], [130, 10, "boa"], [140, 9, "boa"],
      [150, 8, "razoavel"], [150, 9, "boa"], [160, 8, "boa"], [170, 8, "boa"],
    ],
    { lastEntryDaysAgo: LEGS_LAST_DAYS_AGO },
  ),
  ...buildSeries(
    "ex-cadeira-extensora",
    [
      [35, 12, "boa"], [35, 13, "boa"], [38, 12, "boa"], [40, 10, "boa"],
      [40, 11, "razoavel"], [42, 10, "boa"], [42, 10, "boa"], [42, 11, "ruim"],
    ],
    { lastEntryDaysAgo: LEGS_LAST_DAYS_AGO },
  ),
];
