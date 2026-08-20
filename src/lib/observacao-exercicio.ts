import { getDataLocalISO } from "@/lib/timezone";
import type { ExercicioObservacao, Serie } from "@/lib/types";

export function observacaoDoDia(
  observacoes: ExercicioObservacao[],
  exercicioId: string,
  dataISO: string,
): ExercicioObservacao | null {
  return observacoes.find((o) => o.exercicio_id === exercicioId && o.data === dataISO) ?? null;
}

/** Nota mais recente em um dia anterior a `dataISO` (YYYY-MM-DD). */
export function ultimaObservacaoAntes(
  observacoes: ExercicioObservacao[],
  exercicioId: string,
  dataISO: string,
): ExercicioObservacao | null {
  const anteriores = observacoes
    .filter((o) => o.exercicio_id === exercicioId && o.data < dataISO)
    .sort((a, b) => b.data.localeCompare(a.data));
  return anteriores[0] ?? null;
}

/** Dia civil da série e o texto/hint que o diálogo de edição deve mostrar. */
export function contextoObservacaoDoDia(
  observacoes: ExercicioObservacao[],
  serie: Serie | null,
): { dataISO: string; texto: string; ultima: string | null } {
  if (!serie) return { dataISO: "", texto: "", ultima: null };
  const dataISO = getDataLocalISO(new Date(serie.data));
  return {
    dataISO,
    texto: observacaoDoDia(observacoes, serie.exercicio_id, dataISO)?.texto ?? "",
    ultima: ultimaObservacaoAntes(observacoes, serie.exercicio_id, dataISO)?.texto ?? null,
  };
}
