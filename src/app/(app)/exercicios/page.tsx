"use client";

import { AppHeader } from "@/components/layout/app-header";
import { ExercicioRow } from "@/components/dashboard/exercicio-row";
import { TypographyMuted, TypographySectionTitle } from "@/components/ui/typography";
import { getResumoExercicio } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";
import type { Exercicio } from "@/lib/types";

export default function ExerciciosPage() {
  const { treinos, treinoExercicios, exercicios, series, loading } = useAppStore();

  if (loading) {
    return (
      <>
        <AppHeader variant="title" title="Histórico" />
        <main className="flex flex-1 items-center justify-center px-8">
          <TypographyMuted className="text-center">Carregando...</TypographyMuted>
        </main>
      </>
    );
  }

  const treinosOrdenados = [...treinos].sort((a, b) => a.ordem - b.ordem);
  const idsComTreino = new Set(treinoExercicios.map((te) => te.exercicio_id));

  const grupos = treinosOrdenados
    .map((treino) => ({
      treino,
      exercicios: treinoExercicios
        .filter((te) => te.treino_id === treino.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map((te) => exercicios.find((e) => e.id === te.exercicio_id))
        .filter((e): e is Exercicio => e !== undefined),
    }))
    .filter((g) => g.exercicios.length > 0);

  const semTreino = exercicios.filter((e) => !idsComTreino.has(e.id));

  return (
    <>
      <AppHeader variant="title" title="Histórico" />
      {/* pt-6: espaço pro brilho do shadow-soft-elevated do primeiro card não
          ser cortado pela borda deste container com overflow (ver dashboard/page.tsx). */}
      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-6 pb-6">
        {exercicios.length === 0 ? (
          <TypographyMuted className="flex-1 py-10 text-center">
            Nenhum exercício cadastrado ainda. Adicione em &ldquo;Meu Treino&rdquo;.
          </TypographyMuted>
        ) : (
          <>
            {grupos.map((g) => (
              <section key={g.treino.id} className="flex flex-col gap-2.5">
                <TypographySectionTitle>{g.treino.nome}</TypographySectionTitle>
                <div className="flex flex-col gap-2.5">
                  {g.exercicios.map((ex) => (
                    <ExercicioRow
                      key={ex.id}
                      exercicioId={ex.id}
                      {...getResumoExercicio(
                        ex.nome,
                        series.filter((s) => s.exercicio_id === ex.id),
                      )}
                    />
                  ))}
                </div>
              </section>
            ))}

            {semTreino.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <TypographySectionTitle>Sem treino atribuído</TypographySectionTitle>
                <div className="flex flex-col gap-2.5">
                  {semTreino.map((ex) => (
                    <ExercicioRow
                      key={ex.id}
                      exercicioId={ex.id}
                      {...getResumoExercicio(
                        ex.nome,
                        series.filter((s) => s.exercicio_id === ex.id),
                      )}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
