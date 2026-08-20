"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { normalizarNomeVariacao } from "@/lib/variacao-exercicio";
import type { ExercicioVariacao } from "@/lib/types";

interface VariacaoDoDiaControlProps {
  variacoes: ExercicioVariacao[];
  selecionadaId: string | null;
  rotuloPrefixo?: string;
  onSelect: (variacaoId: string | null) => void;
  onCreate: (nome: string) => Promise<void>;
}

export function VariacaoDoDiaControl({
  variacoes,
  selecionadaId,
  rotuloPrefixo = "Hoje",
  onSelect,
  onCreate,
}: VariacaoDoDiaControlProps) {
  const [aberto, setAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const selecionada = variacoes.find((v) => v.id === selecionadaId);
  const rotulo = selecionada ? selecionada.nome : "Padrão";
  const limpo = normalizarNomeVariacao(novoNome);

  async function criarESelecionar() {
    if (!limpo) return;
    setErro(null);
    setCriando(true);
    try {
      await onCreate(limpo);
      setNovoNome("");
      setAberto(false);
    } catch {
      setErro("Não deu pra criar. Esse nome já existe?");
    } finally {
      setCriando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="min-h-11 rounded-xl bg-secondary px-3.5 text-left text-[13px] font-semibold text-muted-foreground active:opacity-80"
      >
        {rotuloPrefixo}: {rotulo}
      </button>

      <Dialog
        open={aberto}
        onOpenChange={(next) => {
          setAberto(next);
          if (!next) {
            setErro(null);
            setNovoNome("");
          }
        }}
      >
        <DialogContent className="max-h-[min(90svh,28rem)] max-w-[340px] overflow-y-auto rounded-2xl bg-card">
          <DialogHeader>
            <DialogTitle>{rotuloPrefixo === "Hoje" ? "Variação de hoje" : "Variação do dia"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setAberto(false);
              }}
              className={`min-h-11 rounded-xl px-3.5 text-left text-sm font-semibold active:opacity-80 ${
                selecionadaId === null ? "bg-accent text-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Padrão
            </button>
            {variacoes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onSelect(v.id);
                  setAberto(false);
                }}
                className={`min-h-11 rounded-xl px-3.5 text-left text-sm font-semibold active:opacity-80 ${
                  selecionadaId === v.id ? "bg-accent text-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {v.nome}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              maxLength={40}
              autoComplete="off"
              placeholder="Ex.: Outra máquina ou com halter/barra"
              className="h-11 rounded-xl px-3.5 text-base"
            />
            <Button
              disabled={!limpo || criando}
              onClick={() => void criarESelecionar()}
              className="shadow-soft-elevated h-11 w-full rounded-xl"
            >
              {criando ? "Salvando..." : rotuloPrefixo === "Hoje" ? "Criar e usar hoje" : "Criar e usar"}
            </Button>
            {erro && (
              <p role="alert" className="text-[13px] text-destructive">
                {erro}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
