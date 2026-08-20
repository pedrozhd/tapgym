"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { SemanaCard } from "@/components/treino/semana-card";
import { TreinoDiaCard } from "@/components/treino/treino-dia-card";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import { exportarTreinosPdf } from "@/lib/export-treino-pdf";
import { useAppStore } from "@/lib/store";
import type { Exercicio, TreinoExercicio } from "@/lib/types";

export default function MeuTreinoPage() {
  const {
    treinos,
    treinoExercicios,
    exercicios,
    series,
    loading,
    addTreino,
    renameTreino,
    removeTreino,
    addExercicioATreino,
    vincularExercicioExistente,
    renameExercicio,
    updateSeriesConfig,
    removeExercicioDoTreino,
    excluirExercicioDefinitivamente,
    reordenarExerciciosDoTreino,
    setTreinoDoDia,
    updateGrupoMuscular,
    exercicioVariacoes,
    exercicioVariacoesDia,
    addVariacaoExercicio,
    renameVariacaoExercicio,
    removeVariacaoExercicio,
  } = useAppStore();

  const [exportando, setExportando] = useState(false);
  const [erroExport, setErroExport] = useState<string | null>(null);

  const treinosOrdenados = [...treinos].sort((a, b) => a.ordem - b.ordem);

  function handleExportarPdf() {
    setErroExport(null);
    setExportando(true);
    try {
      exportarTreinosPdf(treinos, treinoExercicios, exercicios, series);
    } catch (err) {
      console.error("Falha ao exportar PDF do treino:", err);
      setErroExport("Não foi possível gerar o PDF. Tente de novo.");
    } finally {
      setExportando(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader variant="title" title="Meu Treino" />
        <main className="flex flex-1 items-center justify-center px-8">
          <TypographyMuted className="text-center">Carregando...</TypographyMuted>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="title" title="Meu Treino" />
      {/* pt-6: espaço pro brilho do shadow-soft-elevated do primeiro card não
          ser cortado pela borda deste container com overflow (ver dashboard/page.tsx). */}
      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-6 pb-6">
        <div className="flex flex-col gap-4">
          {treinosOrdenados.map((treino) => {
            const exerciciosDoTreino = treinoExercicios
              .filter((te) => te.treino_id === treino.id)
              .map((te) => ({ ...te, exercicio: exercicios.find((e) => e.id === te.exercicio_id) }))
              .filter((te): te is TreinoExercicio & { exercicio: Exercicio } => te.exercicio !== undefined)
              .sort((a, b) => a.ordem - b.ordem)
              .map((te) => ({
                ...te,
                compartilhadoCom: treinoExercicios
                  .filter((outro) => outro.exercicio_id === te.exercicio_id && outro.treino_id !== treino.id)
                  .map((outro) => treinos.find((t) => t.id === outro.treino_id)?.nome || "Sem nome"),
              }));

            return (
              <TreinoDiaCard
                key={treino.id}
                nome={treino.nome}
                exercicios={exerciciosDoTreino}
                todosExercicios={exercicios}
                variacoes={exercicioVariacoes}
                variacoesDia={exercicioVariacoesDia}
                onRename={(nome) => renameTreino(treino.id, nome)}
                onRemoveDia={() => removeTreino(treino.id)}
                onAddExercicio={() => addExercicioATreino(treino.id)}
                onVincularExercicioExistente={(exercicioId) => vincularExercicioExistente(treino.id, exercicioId)}
                onRenameExercicio={renameExercicio}
                onSeriesConfigChange={updateSeriesConfig}
                onReordenarExercicios={reordenarExerciciosDoTreino}
                onDesvincularExercicio={removeExercicioDoTreino}
                onApagarExercicioDefinitivamente={excluirExercicioDefinitivamente}
                onGrupoMuscularChange={updateGrupoMuscular}
                onAddVariacao={async (exercicioId, nome) => {
                  await addVariacaoExercicio(exercicioId, nome);
                }}
                onRenameVariacao={renameVariacaoExercicio}
                onRemoveVariacao={removeVariacaoExercicio}
              />
            );
          })}

          <button
            type="button"
            onClick={addTreino}
            className="shadow-soft-subtle w-full rounded-2xl bg-card py-4 text-sm font-bold"
          >
            + Adicionar treino
          </button>

          {treinosOrdenados.length > 0 && (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={exportando}
                onClick={handleExportarPdf}
                className="h-[52px] w-full rounded-xl text-[15px] font-bold"
              >
                <FileDown data-icon="inline-start" />
                {exportando ? "Gerando…" : "Exportar PDF"}
              </Button>
              {erroExport && (
                <TypographyMuted className="text-center text-destructive">{erroExport}</TypographyMuted>
              )}
            </div>
          )}
        </div>

        {treinosOrdenados.length > 0 && <SemanaCard treinos={treinosOrdenados} onSetTreinoDoDia={setTreinoDoDia} />}
      </main>
    </>
  );
}
