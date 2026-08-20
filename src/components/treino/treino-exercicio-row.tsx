"use client";

import { useState, type HTMLAttributes } from "react";
import { GripVertical, Link2, X } from "lucide-react";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
import { GrupoMuscularSelect } from "@/components/treino/grupo-muscular-select";
import { RemoverExercicioDialog } from "@/components/treino/remover-exercicio-dialog";
import { VariacaoNomeDialog } from "@/components/treino/variacao-nome-dialog";
import type { ExercicioVariacao, ExercicioVariacaoDia, GrupoMuscular } from "@/lib/types";
import { variacaoReferenciada } from "@/lib/variacao-exercicio";

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
  variacoes: ExercicioVariacao[];
  variacoesDia: ExercicioVariacaoDia[];
  /** Variação gravada para hoje; o atalho lê isto. */
  variacaoHojeId: string | null;
  onEscolherVariacaoHoje: (variacaoId: string | null) => Promise<void>;
  onAddVariacao: (nome: string) => Promise<void>;
  onRenameVariacao: (variacaoId: string, nome: string) => Promise<void>;
  onRemoveVariacao: (variacaoId: string) => Promise<void>;
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
  variacoes,
  variacoesDia,
  variacaoHojeId,
  onEscolherVariacaoHoje,
  onAddVariacao,
  onRenameVariacao,
  onRemoveVariacao,
  dragHandleProps,
}: TreinoExercicioRowProps) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [adicionandoVariacao, setAdicionandoVariacao] = useState(false);
  const [renomeando, setRenomeando] = useState<ExercicioVariacao | null>(null);
  const [erroVariacao, setErroVariacao] = useState<string | null>(null);
  const [localId, setLocalId] = useState(variacaoHojeId);
  const [pendente, setPendente] = useState(false);

  if (!pendente && localId !== variacaoHojeId) {
    setLocalId(variacaoHojeId);
  }

  async function escolherHoje(id: string | null) {
    if (id === localId) {
      if (id) {
        const v = variacoes.find((item) => item.id === id);
        if (v) setRenomeando(v);
      }
      return;
    }
    const anterior = variacaoHojeId;
    setLocalId(id);
    setPendente(true);
    setErroVariacao(null);
    try {
      await onEscolherVariacaoHoje(id);
    } catch {
      setLocalId(anterior);
      setErroVariacao("Não deu pra trocar a variação.");
    } finally {
      setPendente(false);
    }
  }

  return (
    // gap-2.5 e py-3: com gap-1.5/py-2.5 o badge de grupamento encostava na
    // linha de séries e na borda de baixo do card. O respiro também deixa a
    // área de toque esticada do badge (44px) não invadir os inputs de reps.
    <div className="shadow-soft-subtle flex flex-col gap-2.5 rounded-xl bg-background px-3.5 py-3">
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
          className="shrink-0 px-1 text-muted-foreground active:opacity-60"
        >
          <X size={16} />
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
        <GrupoMuscularSelect value={grupoMuscular} onChange={onGrupoMuscularChange} />
      </div>

      <div className="flex flex-col gap-1 pl-[26px]">
        {variacoes.length > 0 && (
          <button
            type="button"
            disabled={pendente}
            aria-pressed={localId === null}
            onClick={() => void escolherHoje(null)}
            className={`min-h-11 rounded-xl px-3 text-left text-[13px] font-semibold active:opacity-80 disabled:opacity-70 ${
              localId === null ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            Padrão
          </button>
        )}
        {variacoes.map((v) => {
          const usada = variacaoReferenciada(variacoesDia, v.id);
          const ativa = localId === v.id;
          return (
            <div key={v.id} className="flex min-h-11 items-center gap-1.5">
              <button
                type="button"
                disabled={pendente}
                aria-pressed={ativa}
                onClick={() => void escolherHoje(v.id)}
                className={`min-h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-left text-[13px] font-semibold active:opacity-80 disabled:opacity-70 ${
                  ativa ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                {v.nome}
              </button>
              {!usada && (
                <button
                  type="button"
                  aria-label={`Apagar variação ${v.nome}`}
                  onClick={() => {
                    void onRemoveVariacao(v.id).catch(() => {
                      setErroVariacao("Não deu pra apagar a variação.");
                    });
                  }}
                  className="shrink-0 px-1 text-muted-foreground active:opacity-60"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setAdicionandoVariacao(true)}
          className="min-h-11 text-left text-[13px] font-semibold text-muted-foreground active:opacity-80"
        >
          + Adicionar variação
        </button>
        {erroVariacao && (
          <p role="alert" className="text-[12px] text-destructive">
            {erroVariacao}
          </p>
        )}
      </div>

      <VariacaoNomeDialog
        open={adicionandoVariacao}
        title="Nova variação"
        onOpenChange={setAdicionandoVariacao}
        onConfirm={(nome) => {
          void onAddVariacao(nome).catch(() => {
            setErroVariacao("Não deu pra criar. Esse nome já existe?");
          });
        }}
      />
      <VariacaoNomeDialog
        open={renomeando !== null}
        title="Renomear variação"
        valorInicial={renomeando?.nome ?? ""}
        onOpenChange={(open) => !open && setRenomeando(null)}
        onConfirm={(nome) => {
          if (!renomeando) return;
          void onRenameVariacao(renomeando.id, nome).catch(() => {
            setErroVariacao("Não deu pra renomear. Esse nome já existe?");
          });
        }}
      />

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
