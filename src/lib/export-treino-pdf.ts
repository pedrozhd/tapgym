import { jsPDF } from "jspdf";
import { formatCarga } from "@/lib/dashboard";
import { DIAS_SEMANA } from "@/lib/semana";
import type { Exercicio, Serie, Treino, TreinoExercicio } from "@/lib/types";

export interface RecordeCarga {
  carga: number;
  data: string;
  reps: number;
}

export interface RecordeReps {
  reps: number;
  data: string;
  carga: number;
}

export interface ExercicioExport {
  nome: string;
  numSeries: number;
  repMin: number;
  repMax: number;
  recordeCarga: RecordeCarga | null;
  recordeReps: RecordeReps | null;
}

export interface BlocoTreinoExport {
  titulo: string;
  diasLabel: string | null;
  exercicios: ExercicioExport[];
}

function formatarDataPt(iso: string): string {
  // `serie.data` costuma ser YYYY-MM-DD (date do Postgres). Evita shift de
  // timezone parseando só a parte da data quando possível.
  const soData = iso.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(soData);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return new Date(iso).toLocaleDateString("pt-BR");
}

/** true se `candidata` é mais recente que `atual` (data desc, depois id). */
function ehMaisRecente(candidata: Serie, atual: Serie): boolean {
  const byData = candidata.data.localeCompare(atual.data);
  if (byData !== 0) return byData > 0;
  return candidata.id.localeCompare(atual.id) > 0;
}

/** Empate → série mais recente (`data` desc, depois `id`). */
export function escolherRecordeCarga(series: Serie[]): RecordeCarga | null {
  if (series.length === 0) return null;
  const vencedora = series.reduce((best, s) => {
    if (s.carga > best.carga) return s;
    if (s.carga < best.carga) return best;
    return ehMaisRecente(s, best) ? s : best;
  });
  return { carga: vencedora.carga, data: vencedora.data, reps: vencedora.reps };
}

/** Empate → série mais recente (`data` desc, depois `id`). */
export function escolherRecordeReps(series: Serie[]): RecordeReps | null {
  if (series.length === 0) return null;
  const vencedora = series.reduce((best, s) => {
    if (s.reps > best.reps) return s;
    if (s.reps < best.reps) return best;
    return ehMaisRecente(s, best) ? s : best;
  });
  return { reps: vencedora.reps, data: vencedora.data, carga: vencedora.carga };
}

function tituloTreino(treino: Treino, indice1Based: number): string {
  const nome = treino.nome.trim();
  return nome || `Treino ${indice1Based}`;
}

function labelDias(dias: number[]): string | null {
  if (dias.length === 0) return null;
  const set = new Set(dias);
  const labels = DIAS_SEMANA.filter((d) => set.has(d.valor)).map((d) => d.abrev);
  return labels.length > 0 ? labels.join(", ") : null;
}

export function montarBlocosExport(
  treinos: Treino[],
  treinoExercicios: TreinoExercicio[],
  exercicios: Exercicio[],
  series: Serie[],
): BlocoTreinoExport[] {
  const exerciciosById = new Map(exercicios.map((e) => [e.id, e]));
  const seriesByExercicio = new Map<string, Serie[]>();
  for (const s of series) {
    const list = seriesByExercicio.get(s.exercicio_id);
    if (list) list.push(s);
    else seriesByExercicio.set(s.exercicio_id, [s]);
  }

  const ordenados = [...treinos].sort((a, b) => a.ordem - b.ordem);

  return ordenados.map((treino, i) => {
    const links = treinoExercicios
      .filter((te) => te.treino_id === treino.id)
      .sort((a, b) => a.ordem - b.ordem);

    const exerciciosExport: ExercicioExport[] = [];
    for (const te of links) {
      const ex = exerciciosById.get(te.exercicio_id);
      if (!ex) continue;
      const seriesDoEx = seriesByExercicio.get(te.exercicio_id) ?? [];
      exerciciosExport.push({
        nome: ex.nome.trim() || "Exercício",
        numSeries: te.num_series,
        repMin: te.rep_min,
        repMax: te.rep_max,
        recordeCarga: escolherRecordeCarga(seriesDoEx),
        recordeReps: escolherRecordeReps(seriesDoEx),
      });
    }

    return {
      titulo: tituloTreino(treino, i + 1),
      diasLabel: labelDias(treino.dias_semana),
      exercicios: exerciciosExport,
    };
  });
}

function garantirEspaco(doc: jsPDF, y: number, necessario: number, margem: number, pageH: number): number {
  if (y + necessario <= pageH - margem) return y;
  doc.addPage();
  return margem;
}

/**
 * Gera e baixa `tapgym-treinos.pdf` com todos os treinos em blocos e
 * recordes de carga/reps por exercício (spec 2026-08-10).
 */
export function exportarTreinosPdf(
  treinos: Treino[],
  treinoExercicios: TreinoExercicio[],
  exercicios: Exercicio[],
  series: Serie[],
): void {
  if (treinos.length === 0) {
    throw new Error("Nenhum treino para exportar");
  }

  const blocos = montarBlocosExport(treinos, treinoExercicios, exercicios, series);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margem = 16;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const larguraUtil = pageW - margem * 2;
  let y = margem;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TapGym — Meu Treino", margem, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  const geradoEm = new Date().toLocaleDateString("pt-BR");
  doc.text(`Gerado em ${geradoEm}`, margem, y);
  doc.setTextColor(0);
  y += 10;

  for (const bloco of blocos) {
    y = garantirEspaco(doc, y, 18, margem, pageH);

    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margem, y, pageW - margem, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(bloco.titulo, margem, y);
    y += 5;

    if (bloco.diasLabel) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(bloco.diasLabel, margem, y);
      doc.setTextColor(0);
      y += 5;
    }

    y += 2;

    if (bloco.exercicios.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Nenhum exercício neste treino.", margem, y);
      doc.setTextColor(0);
      y += 8;
      continue;
    }

    for (const ex of bloco.exercicios) {
      y = garantirEspaco(doc, y, 22, margem, pageH);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const nomeLines = doc.splitTextToSize(ex.nome, larguraUtil);
      doc.text(nomeLines, margem, y);
      y += nomeLines.length * 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Prescrição: ${ex.numSeries}× ${ex.repMin}–${ex.repMax}`, margem + 2, y);
      y += 5;

      if (!ex.recordeCarga && !ex.recordeReps) {
        doc.setTextColor(120);
        doc.text("Sem recorde ainda", margem + 2, y);
        doc.setTextColor(0);
        y += 6;
      } else {
        if (ex.recordeCarga) {
          doc.text(
            `Recorde carga: ${formatCarga(ex.recordeCarga.carga)} kg (${formatarDataPt(ex.recordeCarga.data)})`,
            margem + 2,
            y,
          );
          y += 5;
        } else {
          doc.setTextColor(120);
          doc.text("Recorde carga: sem recorde ainda", margem + 2, y);
          doc.setTextColor(0);
          y += 5;
        }
        if (ex.recordeReps) {
          doc.text(
            `Recorde reps: ${ex.recordeReps.reps} reps (${formatarDataPt(ex.recordeReps.data)}) · ${formatCarga(ex.recordeReps.carga)} kg`,
            margem + 2,
            y,
          );
          y += 6;
        } else {
          doc.setTextColor(120);
          doc.text("Recorde reps: sem recorde ainda", margem + 2, y);
          doc.setTextColor(0);
          y += 6;
        }
      }
    }

    y += 4;
  }

  doc.save("tapgym-treinos.pdf");
}
