"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TypographyMuted } from "@/components/ui/typography";
import { useAppStore } from "@/lib/store";
import { useIOS } from "@/lib/use-ios";
import type { Aviso } from "@/lib/types";

function formatarDataAviso(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(iso))
    .replace(".", "");
}

interface AvisosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Caixa de entrada de comunicados de produto. A lista fica aqui; o detalhe de
 * cada aviso abre num Dialog por cima, que é onde a leitura é confirmada — só
 * ao abrir, sem passo extra (ver decisão em docs/CEREBRO.md se um dia isto
 * for documentado lá).
 */
export function AvisosSheet({ open, onOpenChange }: AvisosSheetProps) {
  const { avisos, avisosLidosIds, marcarAvisoLido } = useAppStore();
  const [avisoAbertoId, setAvisoAbertoId] = useState<string | null>(null);
  const avisoAberto = avisos.find((a) => a.id === avisoAbertoId) ?? null;

  // Efeito, não ajuste durante o render: marcar como lido é uma escrita de
  // rede, não uma sincronização de estado puro — não pode rodar duas vezes
  // por engano num re-render.
  useEffect(() => {
    if (avisoAbertoId) marcarAvisoLido(avisoAbertoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avisoAbertoId]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-[430px] rounded-t-2xl border-border bg-card">
          <SheetHeader>
            <SheetTitle>Avisos</SheetTitle>
            <SheetDescription>Novidades e mudanças no TapGym</SheetDescription>
          </SheetHeader>

          <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto px-4 pb-4">
            {avisos.length === 0 ? (
              <TypographyMuted className="py-6 text-center">Nenhum aviso por aqui ainda</TypographyMuted>
            ) : (
              avisos.map((aviso) => {
                const lido = avisosLidosIds.includes(aviso.id);
                return (
                  <button
                    key={aviso.id}
                    type="button"
                    onClick={() => setAvisoAbertoId(aviso.id)}
                    className="shadow-soft-subtle flex items-start gap-3 rounded-xl bg-background px-3.5 py-3 text-left active:opacity-80"
                  >
                    {!lido && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                    <span className={lido ? "min-w-0 flex-1 pl-5" : "min-w-0 flex-1"}>
                      <span className="block truncate text-sm font-bold">{aviso.titulo}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatarDataAviso(aviso.publicado_em)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={avisoAberto !== null} onOpenChange={(next) => !next && setAvisoAbertoId(null)}>
        <DialogContent className="max-w-[min(340px,calc(100%-2rem))] rounded-2xl bg-card">
          {avisoAberto && <AvisoDetalhe aviso={avisoAberto} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AvisoDetalhe({ aviso }: { aviso: Aviso }) {
  // Mesma regra do ícone de raio e do AtalhoCard: um link marcado como
  // "só iOS" (o atalho, tipicamente) não aparece pra quem não tem o app
  // Atalhos. `undefined` (ainda não detectado) conta como "não mostra ainda"
  // pra não pipocar o botão depois do primeiro render.
  const ehIOS = useIOS();
  const mostrarLink = aviso.link_url && (!aviso.link_somente_ios || ehIOS);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{aviso.titulo}</DialogTitle>
      </DialogHeader>
      <p className="text-[13px] leading-relaxed whitespace-pre-line text-muted-foreground">{aviso.corpo}</p>
      {mostrarLink && (
        <Button
          render={<a href={aviso.link_url ?? undefined} target="_blank" rel="noreferrer" />}
          nativeButton={false}
          className="shadow-soft-elevated mt-1 h-11 w-full rounded-xl"
        >
          {aviso.link_label ?? "Abrir"}
        </Button>
      )}
    </>
  );
}
