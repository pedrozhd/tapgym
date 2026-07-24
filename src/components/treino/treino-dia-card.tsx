"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Pencil } from "lucide-react";
import { AdicionarExercicioDialog } from "@/components/treino/adicionar-exercicio-dialog";
import { SortableTreinoExercicioRow } from "@/components/treino/sortable-treino-exercicio-row";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
import { SoftCard } from "@/components/ui/soft-card";
import type { Exercicio, GrupoMuscular, TreinoExercicioComExercicio } from "@/lib/types";

interface TreinoDiaCardProps {
  nome: string;
  exercicios: TreinoExercicioComExercicio[];
  exerciciosDisponiveis: Exercicio[];
  onRename: (nome: string) => void;
  onRemoveDia: () => void;
  onAddExercicio: () => void;
  onVincularExercicioExistente: (exercicioId: string) => void;
  onRenameExercicio: (exercicioId: string, nome: string) => void;
  onSeriesConfigChange: (treinoExercicioId: string, numSeries: number, repMin: number, repMax: number) => void;
  onReordenarExercicios: (treinoExercicioIdsEmOrdem: string[]) => void;
  onDesvincularExercicio: (treinoExercicioId: string) => void;
  onApagarExercicioDefinitivamente: (exercicioId: string) => void;
  onGrupoMuscularChange: (exercicioId: string, grupo: GrupoMuscular) => void;
}

export function TreinoDiaCard({
  nome,
  exercicios,
  exerciciosDisponiveis,
  onRename,
  onRemoveDia,
  onAddExercicio,
  onVincularExercicioExistente,
  onRenameExercicio,
  onSeriesConfigChange,
  onReordenarExercicios,
  onDesvincularExercicio,
  onApagarExercicioDefinitivamente,
  onGrupoMuscularChange,
}: TreinoDiaCardProps) {
  const [editandoNome, setEditandoNome] = useState(false);
  const [adicionandoExercicio, setAdicionandoExercicio] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = exercicios.map((te) => te.id);
    const indiceAntigo = ids.indexOf(String(active.id));
    const indiceNovo = ids.indexOf(String(over.id));
    if (indiceAntigo === -1 || indiceNovo === -1) return;
    onReordenarExercicios(arrayMove(ids, indiceAntigo, indiceNovo));
  }

  return (
    <SoftCard className="p-3.5">
      <div className="flex items-center gap-1.5">
        {editandoNome ? (
          <BlurCommitInput
            value={nome}
            onCommit={onRename}
            onBlur={() => setEditandoNome(false)}
            placeholder="Nome do treino"
            autoFocus
            className="h-auto flex-1 border-none bg-transparent px-0 py-1.5 text-[17px] font-bold shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditandoNome(true)}
            className="flex flex-1 items-center gap-1.5 overflow-hidden py-1.5 text-left"
          >
            <span className="truncate text-[17px] font-bold">{nome || "Nome do treino"}</span>
            <Pencil size={14} className="shrink-0 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Apagar o treino "${nome || "sem nome"}"? Isso não pode ser desfeito.`)) {
              onRemoveDia();
            }
          }}
          aria-label="Remover treino"
          className="px-1.5 text-lg text-muted-foreground"
        >
          ✕
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={exercicios.map((te) => te.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-2.5 flex flex-col gap-2">
            {exercicios.map((te) => (
              <SortableTreinoExercicioRow
                key={te.id}
                id={te.id}
                nome={te.exercicio.nome}
                numSeries={te.num_series}
                repMin={te.rep_min}
                repMax={te.rep_max}
                compartilhadoCom={te.compartilhadoCom}
                onRename={(novoNome) => onRenameExercicio(te.exercicio_id, novoNome)}
                onNumSeriesChange={(v) => onSeriesConfigChange(te.id, v, te.rep_min, te.rep_max)}
                onRepMinChange={(v) => onSeriesConfigChange(te.id, te.num_series, v, te.rep_max)}
                onRepMaxChange={(v) => onSeriesConfigChange(te.id, te.num_series, te.rep_min, v)}
                onDesvincular={() => onDesvincularExercicio(te.id)}
                onApagarDefinitivamente={() => onApagarExercicioDefinitivamente(te.exercicio_id)}
                grupoMuscular={te.exercicio.grupo_muscular}
                onGrupoMuscularChange={(grupo) => onGrupoMuscularChange(te.exercicio_id, grupo)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => setAdicionandoExercicio(true)}
        className="mt-2.5 w-full rounded-[10px] border border-dashed border-input py-2.5 text-[13px] font-semibold text-muted-foreground"
      >
        + Adicionar exercício
      </button>

      <AdicionarExercicioDialog
        open={adicionandoExercicio}
        onOpenChange={setAdicionandoExercicio}
        exerciciosDisponiveis={exerciciosDisponiveis}
        onCriarNovo={onAddExercicio}
        onVincularExistente={onVincularExercicioExistente}
      />
    </SoftCard>
  );
}
