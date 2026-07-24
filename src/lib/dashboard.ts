import { APP_TIMEZONE, getDataLocalISO, getDiaSemanaNoFuso } from "@/lib/timezone";
import { GRUPOS_MUSCULARES } from "@/lib/grupos-musculares";
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

/**
 * Pure functions computing the Dashboard view model from the four core
 * tables. They take plain arrays so the same logic works whether the arrays
 * come from `mock-data.ts` or from Supabase queries later.
 */

export function formatCarga(carga: number): string {
  return (Math.round(carga * 10) / 10).toString().replace(".", ",");
}

export function getUltimaSerie(seriesDoExercicio: Serie[]): Serie | null {
  if (seriesDoExercicio.length === 0) return null;
  return [...seriesDoExercicio].sort((a, b) => b.data.localeCompare(a.data))[0];
}

/**
 * Agrupa séries por dia de treino (sessão) e reduz cada dia à sua melhor
 * série (maior carga, empate por mais reps) — várias séries do mesmo
 * exercício num mesmo dia (o caso comum: 3 séries numa sessão só) viram um
 * único ponto por sessão. Ordenado do mais antigo pro mais recente.
 */
function melhorSeriePorSessao(seriesDoExercicio: Serie[]): Serie[] {
  const seriesPorDia = new Map<string, Serie[]>();
  for (const s of seriesDoExercicio) {
    const dia = getDataLocalISO(new Date(s.data), APP_TIMEZONE);
    const doDia = seriesPorDia.get(dia);
    if (doDia) doDia.push(s);
    else seriesPorDia.set(dia, [s]);
  }

  return [...seriesPorDia.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, doDia]) => [...doDia].sort((a, b) => b.carga - a.carga || b.reps - a.reps)[0]);
}

/**
 * "subiu" needs an increase vs the previous session. Absent that, we only
 * call it "estagnado" once carga has failed to move for 3 sessions running —
 * otherwise a single flat session would look identical to a real plateau.
 */
export function getTendencia(seriesDoExercicio: Serie[]): Tendencia | null {
  const sessoes = melhorSeriePorSessao(seriesDoExercicio);

  if (sessoes.length < 2) return null;

  const ultima = sessoes[sessoes.length - 1];
  const anterior = sessoes[sessoes.length - 2];
  const progrediu =
    ultima.carga > anterior.carga || (ultima.carga === anterior.carga && ultima.reps > anterior.reps);
  if (progrediu) return "subiu";

  const ultimasTres = sessoes.slice(-3);
  const plato = ultimasTres.length === 3 && ultimasTres.every((s) => s.carga <= anterior.carga);
  return plato ? "estagnado" : "manteve";
}

/**
 * O treino de hoje é o que estiver agendado para o dia da semana atual — null
 * se for descanso. "Hoje" é sempre calculado no fuso do app (ver
 * lib/timezone.ts), nunca no fuso do runtime que executa o código — na
 * Vercel isso é UTC, o que faria o dia virar 3h mais cedo que em São Paulo.
 */
export function getTreinoDeHoje(treinos: Treino[], data: Date = new Date()): Treino | null {
  const diaSemana = getDiaSemanaNoFuso(data, APP_TIMEZONE);
  return treinos.find((t) => t.dias_semana.includes(diaSemana)) ?? null;
}

/**
 * Segunda-feira (YYYY-MM-DD) da semana a que `iso` pertence, no fuso do app.
 * Resolve a data civil correta via Intl (que já cobre horário de verão etc.)
 * e só então faz a aritmética de calendário — em UTC "puro", só como
 * calculadora de datas, sem nenhum deslocamento manual de fuso.
 */
function inicioDaSemana(iso: string): string {
  const dataLocal = getDataLocalISO(new Date(iso), APP_TIMEZONE);
  const [ano, mes, dia] = dataLocal.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  const diaSemana = (d.getUTCDay() + 6) % 7; // segunda-feira como início da semana
  d.setUTCDate(d.getUTCDate() - diaSemana);
  return d.toISOString().slice(0, 10);
}

export function getVolumeSemanal(series: Serie[], semanas = 8): VolumeSemana[] {
  const porSemana = new Map<string, number>();
  for (const s of series) {
    const chave = inicioDaSemana(s.data);
    porSemana.set(chave, (porSemana.get(chave) ?? 0) + s.carga * s.reps);
  }
  return [...porSemana.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-semanas)
    .map(([semana, volume]) => ({ semana, volume: Math.round(volume) }));
}

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

/** Só sugere progressão de carga se as repetições alcançaram o topo da faixa com boa qualidade. */
export function shouldSugerirProgressao(reps: number, repMax: number, qualidade: Qualidade | null): boolean {
  return reps >= repMax && qualidade === "boa";
}

export interface ExercicioEvolucao {
  exercicioId: string;
  nome: string;
  volumeInicial: number;
  volumeAtual: number;
  deltaPercentual: number;
}

/**
 * Exercício com o maior ganho percentual de volume (carga × reps da melhor
 * série) entre a primeira e a sessão mais recente — mesma unidade que o
 * Volume Semanal, então dá pra comparar exercícios de cargas bem diferentes
 * (ex: Supino vs. Rosca) na mesma escala. Exige pelo menos 2 sessões; exclui
 * exercícios cuja primeira sessão teve volume 0 (não dá pra calcular %).
 */
export function getExercicioMaisEvoluido(exercicios: Exercicio[], series: Serie[]): ExercicioEvolucao | null {
  let melhor: ExercicioEvolucao | null = null;

  for (const exercicio of exercicios) {
    const seriesDoExercicio = series.filter((s) => s.exercicio_id === exercicio.id);
    const sessoes = melhorSeriePorSessao(seriesDoExercicio);
    if (sessoes.length < 2) continue;

    const primeira = sessoes[0];
    const ultima = sessoes[sessoes.length - 1];
    const volumeInicial = primeira.carga * primeira.reps;
    const volumeAtual = ultima.carga * ultima.reps;
    if (volumeInicial <= 0) continue;

    const deltaPercentual = ((volumeAtual - volumeInicial) / volumeInicial) * 100;
    if (!melhor || deltaPercentual > melhor.deltaPercentual) {
      melhor = { exercicioId: exercicio.id, nome: exercicio.nome, volumeInicial, volumeAtual, deltaPercentual };
    }
  }

  return melhor;
}

const HISTORICO_EM_FOCO_MAX_SESSOES = 8;

/** Quantas séries de `seriesDoExercicio` caem no dia civil `hojeISO` (fuso do app). */
function contarSeriesNoDia(seriesDoExercicio: Serie[], hojeISO: string): number {
  return seriesDoExercicio.filter((s) => getDataLocalISO(new Date(s.data), APP_TIMEZONE) === hojeISO).length;
}

export interface ExercicioEmFoco {
  exercicioId: string;
  nome: string;
  /** Última carga conhecida (de hoje, se já houver série registrada, senão histórica). */
  cargaAtual: number | null;
  seriesHoje: number;
  numSeries: number;
  /** Até 8 sessões mais recentes, mais antiga primeiro. */
  historico: { data: string; carga: number }[];
}

/**
 * O primeiro exercício do treino de hoje (na ordem configurada) que ainda não
 * bateu sua meta de séries hoje. `null` quando todos já bateram — quem chama
 * distingue esse caso de "sem treino hoje" pelo próprio `dashboard.treino`.
 */
function getExercicioEmFoco(
  exerciciosDoTreino: TreinoExercicio[],
  exercicios: Exercicio[],
  series: Serie[],
  hojeISO: string,
): ExercicioEmFoco | null {
  for (const te of exerciciosDoTreino) {
    const seriesDoExercicio = series.filter((s) => s.exercicio_id === te.exercicio_id);
    const seriesHoje = contarSeriesNoDia(seriesDoExercicio, hojeISO);
    if (seriesHoje >= te.num_series) continue;

    const exercicio = exercicios.find((e) => e.id === te.exercicio_id);
    const sessoes = melhorSeriePorSessao(seriesDoExercicio);
    return {
      exercicioId: te.exercicio_id,
      nome: exercicio?.nome ?? "Exercício",
      cargaAtual: getUltimaSerie(seriesDoExercicio)?.carga ?? null,
      seriesHoje,
      numSeries: te.num_series,
      historico: sessoes.slice(-HISTORICO_EM_FOCO_MAX_SESSOES).map((s) => ({ data: s.data, carga: s.carga })),
    };
  }
  return null;
}

export interface ResumoExercicio {
  nome: string;
  ultimaSerieLabel: string;
  tendencia: Tendencia | null;
}

export function getResumoExercicio(nome: string, seriesDoExercicio: Serie[]): ResumoExercicio {
  const ultima = getUltimaSerie(seriesDoExercicio);
  return {
    nome,
    ultimaSerieLabel: ultima ? `${formatCarga(ultima.carga)} kg × ${ultima.reps}` : "Sem registros",
    tendencia: getTendencia(seriesDoExercicio),
  };
}

export interface DashboardExercicioVM extends ResumoExercicio {
  treinoExercicioId: string;
  exercicioId: string;
}

export interface DashboardVM {
  treino: { id: string; nome: string; totalExercicios: number } | null;
  exercicios: DashboardExercicioVM[];
  volumeSemanal: VolumeSemana[];
  volumeSeriesPorGrupo: VolumeGrupoSemana[];
  exerciciosSemGrupo: number;
  exercicioMaisEvoluido: ExercicioEvolucao | null;
  exercicioEmFoco: ExercicioEmFoco | null;
}

export function getDashboardData(
  treinos: Treino[],
  treinoExercicios: TreinoExercicio[],
  exercicios: Exercicio[],
  series: Serie[],
  data: Date = new Date(),
): DashboardVM {
  const treinoDeHoje = getTreinoDeHoje(treinos, data);
  const { volumes: volumeSeriesPorGrupo, exerciciosSemGrupo } = getVolumeSeriesPorGrupo(
    series,
    exercicios,
    data,
  );
  if (!treinoDeHoje) {
    return {
      treino: null,
      exercicios: [],
      volumeSemanal: getVolumeSemanal(series),
      volumeSeriesPorGrupo,
      exerciciosSemGrupo,
      exercicioMaisEvoluido: getExercicioMaisEvoluido(exercicios, series),
      exercicioEmFoco: null,
    };
  }

  const exerciciosDoTreino = treinoExercicios
    .filter((te) => te.treino_id === treinoDeHoje.id)
    .sort((a, b) => a.ordem - b.ordem);

  const exerciciosVM: DashboardExercicioVM[] = exerciciosDoTreino.map((te) => {
    const exercicio = exercicios.find((e) => e.id === te.exercicio_id);
    const seriesDoExercicio = series.filter((s) => s.exercicio_id === te.exercicio_id);
    return {
      treinoExercicioId: te.id,
      exercicioId: te.exercicio_id,
      ...getResumoExercicio(exercicio?.nome ?? "Exercício", seriesDoExercicio),
    };
  });

  const hojeISO = getDataLocalISO(data, APP_TIMEZONE);

  return {
    treino: {
      id: treinoDeHoje.id,
      nome: treinoDeHoje.nome,
      totalExercicios: exerciciosVM.length,
    },
    exercicios: exerciciosVM,
    volumeSemanal: getVolumeSemanal(series),
    volumeSeriesPorGrupo,
    exerciciosSemGrupo,
    exercicioMaisEvoluido: getExercicioMaisEvoluido(exercicios, series),
    exercicioEmFoco: getExercicioEmFoco(exerciciosDoTreino, exercicios, series, hojeISO),
  };
}
