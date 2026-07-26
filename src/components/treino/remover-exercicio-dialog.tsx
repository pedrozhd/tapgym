"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RemoverExercicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeExercicio: string;
  onDesvincular: () => void;
  onApagarDefinitivamente: () => void;
}

export function RemoverExercicioDialog({
  open,
  onOpenChange,
  nomeExercicio,
  onDesvincular,
  onApagarDefinitivamente,
}: RemoverExercicioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Remover {nomeExercicio || "exercício"}?</DialogTitle>
          <DialogDescription className="leading-relaxed">
            <strong className="text-foreground">Desvincular</strong> tira o exercício deste treino, mas guarda o
            histórico de séries. Dá pra adicionar de volta depois sem perder o progresso registrado.{" "}
            <strong className="text-foreground">Apagar completamente</strong> exclui o exercício e todo o
            histórico de séries dele, sem volta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onDesvincular();
              onOpenChange(false);
            }}
            className="h-11 rounded-xl"
          >
            Desvincular (mantém histórico)
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onApagarDefinitivamente();
              onOpenChange(false);
            }}
            className="h-11 rounded-xl"
          >
            Apagar completamente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
