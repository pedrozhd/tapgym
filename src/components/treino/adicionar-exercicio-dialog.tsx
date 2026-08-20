"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import { VariacaoNomeDialog } from "@/components/treino/variacao-nome-dialog";
import { variacoesDoExercicio } from "@/lib/variacao-exercicio";
import type { Exercicio, ExercicioVariacao } from "@/lib/types";

interface AdicionarExercicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercicios: Exercicio[];
  idsNesteTreino: Set<string>;
  variacoes: ExercicioVariacao[];
  onCriarNovo: () => void;
  onVincularExistente: (exercicioId: string) => void;
  onAddVariacao: (exercicioId: string, nome: string) => Promise<void>;
}

export function AdicionarExercicioDialog({
  open,
  onOpenChange,
  exercicios,
  idsNesteTreino,
  variacoes,
  onCriarNovo,
  onVincularExistente,
  onAddVariacao,
}: AdicionarExercicioDialogProps) {
  const [paiNovaVariacao, setPaiNovaVariacao] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ordenados = [...exercicios].sort((a, b) =>
    (a.nome || "Exercício sem nome").localeCompare(b.nome || "Exercício sem nome", "pt-BR", {
      sensitivity: "base",
    }),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[80vh] max-w-[340px] flex-col rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle>Adicionar exercício</DialogTitle>
            {exercicios.length > 0 && (
              <DialogDescription>
                Crie um novo, reaproveite um que já existe, ou acrescente uma variação embaixo.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                onCriarNovo();
                onOpenChange(false);
              }}
              className="shrink-0 rounded-xl border border-dashed border-input px-4 py-3 text-left text-sm font-semibold text-muted-foreground"
            >
              + Criar exercício novo
            </button>

            {ordenados.length > 0 && (
              <>
                <TypographyEyebrow className="mt-2 shrink-0 px-1">Já existentes</TypographyEyebrow>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                  {ordenados.map((ex) => {
                    const jaNoTreino = idsNesteTreino.has(ex.id);
                    const filhos = variacoesDoExercicio(variacoes, ex.id);
                    return (
                      <div key={ex.id} className="flex flex-col gap-1">
                        {jaNoTreino ? (
                          <p className="px-1 text-sm font-semibold text-muted-foreground">
                            {ex.nome || "Exercício sem nome"}
                            <span className="ml-1.5 text-[11px] font-medium">já neste treino</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onVincularExistente(ex.id);
                              onOpenChange(false);
                            }}
                            className="shrink-0 rounded-xl border border-border px-4 py-3 text-left text-sm font-semibold"
                          >
                            {ex.nome || "Exercício sem nome"}
                          </button>
                        )}
                        {filhos.map((v) => (
                          <p key={v.id} className="pl-6 text-[13px] text-muted-foreground">
                            {v.nome}
                          </p>
                        ))}
                        <button
                          type="button"
                          onClick={() => setPaiNovaVariacao(ex.id)}
                          className="min-h-11 pl-6 text-left text-[13px] font-semibold text-muted-foreground active:opacity-80"
                        >
                          + Adicionar variação
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {erro && <TypographyMuted className="text-destructive">{erro}</TypographyMuted>}
          </div>
        </DialogContent>
      </Dialog>

      <VariacaoNomeDialog
        open={paiNovaVariacao !== null}
        title="Nova variação"
        onOpenChange={(next) => !next && setPaiNovaVariacao(null)}
        onConfirm={(nome) => {
          if (!paiNovaVariacao) return;
          void onAddVariacao(paiNovaVariacao, nome).catch(() => {
            setErro("Não deu pra criar a variação. Esse nome já existe?");
          });
        }}
      />
    </>
  );
}
