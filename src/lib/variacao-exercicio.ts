import { getDataLocalISO } from "@/lib/timezone";
import type { ExercicioVariacao, ExercicioVariacaoDia, Serie } from "@/lib/types";

export const SEPARADOR_NOME_VARIACAO = " · ";

export function normalizarNomeVariacao(texto: string): string {
  return texto.trim().slice(0, 40);
}

export function nomeAtalho(paiNome: string, variacaoNome: string | null): string {
  const pai = paiNome.trim();
  const vari = variacaoNome?.trim() ?? "";
  if (pai && vari) return `${pai}${SEPARADOR_NOME_VARIACAO}${vari}`;
  if (vari) return vari;
  if (pai) return pai;
  return "Exercício";
}

export function variacoesDoExercicio(
  variacoes: ExercicioVariacao[],
  exercicioId: string,
): ExercicioVariacao[] {
  return variacoes
    .filter((v) => v.exercicio_id === exercicioId)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export function variacaoIdDoDia(
  dias: ExercicioVariacaoDia[],
  exercicioId: string,
  dataISO: string,
): string | null {
  return dias.find((d) => d.exercicio_id === exercicioId && d.data === dataISO)?.variacao_id ?? null;
}

export function nomeVariacao(
  variacoes: ExercicioVariacao[],
  variacaoId: string | null,
): string | null {
  if (!variacaoId) return null;
  return variacoes.find((v) => v.id === variacaoId)?.nome ?? null;
}

export function diaCivilDaSerie(serie: Serie): string {
  return getDataLocalISO(new Date(serie.data));
}

export function classificacaoDaSerie(
  serie: Serie,
  dias: ExercicioVariacaoDia[],
): string | null {
  return variacaoIdDoDia(dias, serie.exercicio_id, diaCivilDaSerie(serie));
}

export function seriesDaClassificacao(
  series: Serie[],
  dias: ExercicioVariacaoDia[],
  exercicioId: string,
  filtro: "todas" | "padrao" | string,
): Serie[] {
  const doEx = series.filter((s) => s.exercicio_id === exercicioId);
  if (filtro === "todas") return doEx;
  const alvo = filtro === "padrao" ? null : filtro;
  return doEx.filter((s) => classificacaoDaSerie(s, dias) === alvo);
}

export function ultimaSerieDaClassificacao(
  series: Serie[],
  dias: ExercicioVariacaoDia[],
  exercicioId: string,
  variacaoId: string | null,
): Serie | null {
  const filtro = variacaoId === null ? "padrao" : variacaoId;
  const filtradas = seriesDaClassificacao(series, dias, exercicioId, filtro);
  if (filtradas.length === 0) return null;
  return [...filtradas].sort((a, b) => b.data.localeCompare(a.data))[0];
}

/** Classificações distintas no histórico; Padrão entra como null. */
export function classificacoesNoHistorico(
  series: Serie[],
  dias: ExercicioVariacaoDia[],
  exercicioId: string,
): Array<string | null> {
  const ids = new Set<string | null>();
  for (const s of series.filter((serie) => serie.exercicio_id === exercicioId)) {
    ids.add(classificacaoDaSerie(s, dias));
  }
  return [...ids];
}

export function variacaoReferenciada(
  dias: ExercicioVariacaoDia[],
  variacaoId: string,
): boolean {
  return dias.some((d) => d.variacao_id === variacaoId);
}
