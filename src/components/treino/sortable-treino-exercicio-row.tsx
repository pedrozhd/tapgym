"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TreinoExercicioRow } from "@/components/treino/treino-exercicio-row";
import type { GrupoMuscular } from "@/lib/types";

interface SortableTreinoExercicioRowProps {
  id: string;
  nome: string;
  numSeries: number;
  repMin: number;
  repMax: number;
  grupoMuscular: GrupoMuscular | null;
  onGrupoMuscularChange: (grupo: GrupoMuscular) => void;
  compartilhadoCom: string[];
  onRename: (nome: string) => void;
  onNumSeriesChange: (value: number) => void;
  onRepMinChange: (value: number) => void;
  onRepMaxChange: (value: number) => void;
  onDesvincular: () => void;
  onApagarDefinitivamente: () => void;
}

export function SortableTreinoExercicioRow({ id, ...rowProps }: SortableTreinoExercicioRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TreinoExercicioRow {...rowProps} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}
