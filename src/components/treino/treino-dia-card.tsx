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
import { ChevronDown, Pencil } from "lucide-react";
import { AdicionarExercicioDialog } from "@/components/treino/adicionar-exercicio-dialog";
import { SortableTreinoExercicioRow } from "@/components/treino/sortable-treino-exercicio-row";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
import { SoftCard } from "@/components/ui/soft-card";
import { cn } from "@/lib/utils";
import type { Exercicio, ExercicioVariacao, ExercicioVariacaoDia, GrupoMuscular, TreinoExercicioComExercicio } from "@/lib/types";
import { variacoesDoExercicio } from "@/lib/variacao-exercicio";

interface TreinoDiaCardProps {
  nome: string;
  exercicios: TreinoExercicioComExercicio[];
  todosExercicios: Exercicio[];
  variacoes: ExercicioVariacao[];
  variacoesDia: ExercicioVariacaoDia[];
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
  onAddVariacao: (exercicioId: string, nome: string) => Promise<void>;
  onRenameVariacao: (variacaoId: string, nome: string) => Promise<void>;
  onRemoveVariacao: (variacaoId: string) => Promise<void>;
}

export function TreinoDiaCard({
  nome,
  exercicios,
  todosExercicios,
  variacoes,
  variacoesDia,
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
  onAddVariacao,
  onRenameVariacao,
  onRemoveVariacao,
}: TreinoDiaCardProps) {
  const [aberto, setAberto] = useState(exercicios.length === 0);
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

  const qtd = exercicios.length;
  const resumoExercicios =
    qtd === 0 ? "Nenhum exercício" : qtd === 1 ? "1 exercício" : `${qtd} exercícios`;

  return (
    <SoftCard className="p-3.5">
      <div className="flex items-center gap-1">
        {editandoNome ? (
          <BlurCommitInput
            value={nome}
            onCommit={(novo) => {
              onRename(novo);
              setEditandoNome(false);
            }}
            onBlur={() => setEditandoNome(false)}
            placeholder="Nome do treino"
            autoFocus
            className="h-auto flex-1 border-none bg-transparent px-0 py-1.5 text-[17px] font-bold shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left active:opacity-80"
          >
            <ChevronDown
              size={18}
              className={cn(
                "shrink-0 text-muted-foreground transition-transform duration-200",
                aberto && "rotate-180",
              )}
              aria-hidden
            />
            <span className="flex min-w-0 flex-1 flex-col items-start">
              <span className="w-full truncate text-[17px] font-bold leading-tight">
                {nome || "Nome do treino"}
              </span>
              {!aberto && (
                <span className="text-[13px] text-muted-foreground">{resumoExercicios}</span>
              )}
            </span>
          </button>
        )}

        {!editandoNome && (
          <button
            type="button"
            onClick={() => {
              setAberto(true);
              setEditandoNome(true);
            }}
            aria-label="Renomear treino"
            className="shrink-0 p-1.5 text-muted-foreground active:opacity-70"
          >
            <Pencil size={14} />
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
          className="shrink-0 px-1.5 text-lg text-muted-foreground active:opacity-70"
        >
          ✕
        </button>
      </div>

      {aberto && (
        <>
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
                    variacoes={variacoesDoExercicio(variacoes, te.exercicio_id)}
                    variacoesDia={variacoesDia}
                    onAddVariacao={(nome) => onAddVariacao(te.exercicio_id, nome)}
                    onRenameVariacao={onRenameVariacao}
                    onRemoveVariacao={onRemoveVariacao}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={() => setAdicionandoExercicio(true)}
            className="mt-2.5 w-full rounded-[10px] border border-dashed border-input py-2.5 text-[13px] font-semibold text-muted-foreground active:opacity-80"
          >
            + Adicionar exercício
          </button>
        </>
      )}

      <AdicionarExercicioDialog
        open={adicionandoExercicio}
        onOpenChange={setAdicionandoExercicio}
        exercicios={todosExercicios}
        idsNesteTreino={new Set(exercicios.map((te) => te.exercicio_id))}
        variacoes={variacoes}
        onCriarNovo={onAddExercicio}
        onVincularExistente={onVincularExercicioExistente}
        onAddVariacao={onAddVariacao}
      />
    </SoftCard>
  );
}
