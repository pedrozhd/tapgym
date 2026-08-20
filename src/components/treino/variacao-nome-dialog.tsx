"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { normalizarNomeVariacao } from "@/lib/variacao-exercicio";

interface VariacaoNomeDialogProps {
  open: boolean;
  title: string;
  valorInicial?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nome: string) => void;
}

export function VariacaoNomeDialog({
  open,
  title,
  valorInicial = "",
  onOpenChange,
  onConfirm,
}: VariacaoNomeDialogProps) {
  const [nome, setNome] = useState(valorInicial);
  const [sincronizado, setSincronizado] = useState(false);

  if (open && !sincronizado) {
    setSincronizado(true);
    setNome(valorInicial);
  }
  if (!open && sincronizado) {
    setSincronizado(false);
  }

  const limpo = normalizarNomeVariacao(nome);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          autoComplete="off"
          placeholder="Ex.: Outra máquina ou com halter/barra"
          className="h-11 rounded-xl px-3.5 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && limpo) {
              onConfirm(limpo);
              onOpenChange(false);
            }
          }}
        />
        <Button
          disabled={!limpo}
          onClick={() => {
            onConfirm(limpo);
            onOpenChange(false);
          }}
          className="shadow-soft-elevated h-11 w-full rounded-xl"
        >
          Salvar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
