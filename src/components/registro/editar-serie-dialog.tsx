"use client";

import { useState } from "react";
import { QualidadePicker } from "@/components/registro/qualidade-picker";
import { VariacaoDoDiaControl } from "@/components/registro/variacao-do-dia-control";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TypographyMuted } from "@/components/ui/typography";
import { formatCarga, parseCarga } from "@/lib/dashboard";
import type { ExercicioVariacao, Qualidade, Serie } from "@/lib/types";

interface EditarSerieDialogProps {
  serie: Serie | null;
  /** Nota do exercício no dia civil desta série, não da série em si. */
  observacaoDia: string;
  /** Última nota de um dia anterior; só aparece se o campo do dia estiver vazio. */
  ultimaObservacao: string | null;
  variacoes: ExercicioVariacao[];
  variacaoDiaId: string | null;
  onCreateVariacao: (nome: string) => Promise<string | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (
    serieId: string,
    carga: number,
    reps: number,
    qualidade: Qualidade,
    observacaoDia: string,
    variacaoDiaId: string | null,
  ) => Promise<void>;
  onDelete: (serieId: string) => Promise<void>;
}

export function EditarSerieDialog({
  serie,
  observacaoDia,
  ultimaObservacao,
  variacoes,
  variacaoDiaId,
  onCreateVariacao,
  onOpenChange,
  onSave,
  onDelete,
}: EditarSerieDialogProps) {
  const [carga, setCarga] = useState(0);
  // Texto separado do número, mesmo motivo do CargaCard: sem isso, "17,"
  // digitado no meio da edição vira 17 e o input reescreve por cima, comendo
  // o dígito seguinte.
  const [textoCarga, setTextoCarga] = useState("");
  const [reps, setReps] = useState(0);
  const [qualidade, setQualidade] = useState<Qualidade | null>(null);
  const [observacao, setObservacao] = useState("");
  const [variacaoId, setVariacaoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [serieIdSincronizado, setSerieIdSincronizado] = useState<string | null>(null);

  // Repopula os campos sempre que uma nova série é aberta pra edição,
  // ajustado durante o render (guia do React) em vez de um efeito, pra não
  // custar um commit extra. Ao fechar, zera o id sincronizado senão reabrir
  // a mesma série manteria edições canceladas.
  if (!serie) {
    if (serieIdSincronizado !== null) setSerieIdSincronizado(null);
  } else if (serie.id !== serieIdSincronizado) {
    setSerieIdSincronizado(serie.id);
    setCarga(serie.carga);
    setTextoCarga(serie.carga === 0 ? "" : formatCarga(serie.carga));
    setReps(serie.reps);
    setQualidade(serie.qualidade);
    setObservacao(observacaoDia);
    setVariacaoId(variacaoDiaId);
    setConfirmandoExclusao(false);
    setErro(null);
  }

  const ocupado = salvando || apagando;

  async function onSubmit() {
    if (!serie || !qualidade || carga <= 0 || reps <= 0) return;
    setErro(null);
    setSalvando(true);
    try {
      await onSave(serie.id, carga, reps, qualidade, observacao, variacaoId);
      onOpenChange(false);
    } catch {
      setErro("Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function onConfirmarExclusao() {
    if (!serie) return;
    setErro(null);
    setApagando(true);
    try {
      await onDelete(serie.id);
      onOpenChange(false);
    } catch {
      setErro("Não deu pra apagar. Tenta de novo.");
      setConfirmandoExclusao(false);
    } finally {
      setApagando(false);
    }
  }

  return (
    <Dialog open={serie !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90svh,40rem)] max-w-[340px] overflow-y-auto rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Editar série</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2.5">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Carga (kg)</span>
            <Input
              inputMode="decimal"
              value={textoCarga}
              onChange={(e) => {
                setTextoCarga(e.target.value);
                setCarga(parseCarga(e.target.value));
              }}
              onBlur={() => setTextoCarga(carga === 0 ? "" : formatCarga(carga))}
              className="h-11 rounded-xl text-center text-lg font-bold"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Reps</span>
            <Input
              type="number"
              inputMode="numeric"
              value={reps === 0 ? "" : String(reps)}
              onChange={(e) => setReps(Number(e.target.value) || 0)}
              className="h-11 rounded-xl text-center text-lg font-bold"
            />
          </div>
        </div>

        <QualidadePicker qualidade={qualidade} onChange={setQualidade} />

        <VariacaoDoDiaControl
          rotuloPrefixo="Variação"
          variacoes={variacoes}
          selecionadaId={variacaoId}
          onSelect={setVariacaoId}
          onCreate={async (nome) => {
            const id = await onCreateVariacao(nome);
            if (id) setVariacaoId(id);
          }}
        />

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Observação do dia</span>
          <Input
            id="observacao-do-dia"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            maxLength={200}
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Ex.: tríceps com a corda"
            className="h-11 rounded-xl px-3.5 text-base"
          />
          {!observacao.trim() && ultimaObservacao && (
            <TypographyMuted>Última: {ultimaObservacao}</TypographyMuted>
          )}
        </div>

        {erro && (
          <p role="alert" className="text-[13px] text-destructive">
            {erro}
          </p>
        )}

        <Button
          onClick={onSubmit}
          disabled={ocupado || carga <= 0 || reps <= 0 || !qualidade}
          className="shadow-soft-elevated h-11 w-full rounded-xl"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </Button>

        {/* Confirmação em dois toques, no lugar do window.confirm que era usado
            antes: fica dentro do desenho do app e mantém a ação destrutiva
            separada do "Salvar", em vez de encostada num ícone de 12px. */}
        {confirmandoExclusao ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p className="text-center text-[13px] text-muted-foreground">
              Apagar essa série? Não dá pra desfazer.
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={ocupado}
                className="h-11 flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirmarExclusao}
                disabled={ocupado}
                className="h-11 flex-1 rounded-xl font-bold"
              >
                {apagando ? "Apagando..." : "Apagar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setConfirmandoExclusao(true)}
            disabled={ocupado}
            className="h-11 w-full rounded-xl text-destructive"
          >
            Apagar série
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
