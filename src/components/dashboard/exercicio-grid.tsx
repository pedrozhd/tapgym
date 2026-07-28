import { ExercicioRow } from "@/components/dashboard/exercicio-row";
import { TypographySectionTitle } from "@/components/ui/typography";
import type { DashboardExercicioVM } from "@/lib/dashboard";

interface Props {
  exercicios: DashboardExercicioVM[];
  /** "Resto do treino" quando o exercício em foco já aparece no card acima. */
  titulo?: string;
}

export function ExercicioGrid({ exercicios, titulo = "Exercícios de hoje" }: Props) {
  // Pode ficar vazio quando o treino tem um exercício só e ele está em foco.
  if (exercicios.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <TypographySectionTitle>{titulo}</TypographySectionTitle>
      <div className="flex flex-col gap-2.5">
        {exercicios.map((ex) => (
          <ExercicioRow
            key={ex.treinoExercicioId}
            exercicioId={ex.exercicioId}
            nome={ex.nome}
            ultimaSerieLabel={ex.ultimaSerieLabel}
            tendencia={ex.tendencia}
          />
        ))}
      </div>
    </section>
  );
}
