"use client";

import { useState, type HTMLAttributes } from "react";
import { GripVertical, Link2 } from "lucide-react";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
import { RemoverExercicioDialog } from "@/components/treino/remover-exercicio-dialog";
import { GRUPOS_MUSCULARES, LABEL_GRUPO_MUSCULAR } from "@/lib/grupos-musculares";
import type { GrupoMuscular } from "@/lib/types";

interface TreinoExercicioRowProps {
  nome: string;
  numSeries: number;
  repMin: number;
  repMax: number;
  grupoMuscular: GrupoMuscular | null;
  onGrupoMuscularChange: (grupo: GrupoMuscular) => void;
  /** Nomes de outros treinos que também usam este mesmo exercício (histórico compartilhado). */
  compartilhadoCom: string[];
  onRename: (nome: string) => void;
  onNumSeriesChange: (value: number) => void;
  onRepMinChange: (value: number) => void;
  onRepMaxChange: (value: number) => void;
  onDesvincular: () => void;
  onApagarDefinitivamente: () => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
}

export function TreinoExercicioRow({
  nome,
  numSeries,
  repMin,
  repMax,
  grupoMuscular,
  onGrupoMuscularChange,
  compartilhadoCom,
  onRename,
  onNumSeriesChange,
  onRepMinChange,
  onRepMaxChange,
  onDesvincular,
  onApagarDefinitivamente,
  dragHandleProps,
}: TreinoExercicioRowProps) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  return (
    <div className="shadow-soft-subtle flex flex-col gap-1.5 rounded-xl bg-background px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Arrastar para reordenar"
          className="flex-none touch-none text-muted-foreground active:opacity-60"
          {...dragHandleProps}
        >
          <GripVertical size={16} />
        </button>

        <BlurCommitInput
          value={nome}
          onCommit={onRename}
          placeholder="Exercício"
          className="h-auto min-w-0 flex-1 border-none bg-transparent px-0 py-1 text-sm font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
        />

        {compartilhadoCom.length > 0 && (
          <span
            className="shrink-0 text-muted-foreground"
            title={`Mesmo exercício também em: ${compartilhadoCom.join(", ")}`}
          >
            <Link2 size={14} aria-label={`Mesmo exercício também em: ${compartilhadoCom.join(", ")}`} />
          </span>
        )}

        <button
          type="button"
          onClick={() => setConfirmandoRemocao(true)}
          aria-label="Remover exercício"
          className="shrink-0 px-1 text-base text-muted-foreground"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center gap-1.5 pl-[26px] text-xs text-muted-foreground">
        <BlurCommitInput
          value={numSeries ? String(numSeries) : ""}
          onCommit={(v) => onNumSeriesChange(Number(v) || 0)}
          inputMode="numeric"
          placeholder="3"
          aria-label="Número de séries"
          className="h-7 w-7 shrink-0 border-input bg-secondary/60 px-1 text-center text-[13px]"
        />
        <span className="shrink-0">séries de</span>
        <BlurCommitInput
          value={repMin ? String(repMin) : ""}
          onCommit={(v) => onRepMinChange(Number(v) || 0)}
          inputMode="numeric"
          placeholder="5"
          aria-label="Repetições mínimas"
          className="h-7 w-7 shrink-0 border-input bg-secondary/60 px-1 text-center text-[13px]"
        />
        <span className="shrink-0">–</span>
        <BlurCommitInput
          value={repMax ? String(repMax) : ""}
          onCommit={(v) => onRepMaxChange(Number(v) || 0)}
          inputMode="numeric"
          placeholder="8"
          aria-label="Repetições máximas"
          className="h-7 w-7 shrink-0 border-input bg-secondary/60 px-1 text-center text-[13px]"
        />
        <span className="shrink-0">reps</span>
      </div>

      <div className="pl-[26px]">
        <select
          aria-label="Grupamento muscular"
          value={grupoMuscular ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            onGrupoMuscularChange(value as GrupoMuscular);
          }}
          className="h-7 w-full max-w-[220px] rounded-md border border-input bg-secondary/60 px-2 text-[13px] text-foreground"
        >
          <option value="" disabled>
            Escolher grupamento
          </option>
          {GRUPOS_MUSCULARES.map((grupo) => (
            <option key={grupo} value={grupo}>
              {LABEL_GRUPO_MUSCULAR[grupo]}
            </option>
          ))}
        </select>
      </div>

      <RemoverExercicioDialog
        open={confirmandoRemocao}
        onOpenChange={setConfirmandoRemocao}
        nomeExercicio={nome}
        onDesvincular={onDesvincular}
        onApagarDefinitivamente={onApagarDefinitivamente}
      />
    </div>
  );
}
