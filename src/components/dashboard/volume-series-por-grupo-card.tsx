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
