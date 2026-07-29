"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShortcutDialog } from "@/components/layout/shortcut-dialog";
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyH4, TypographyMuted } from "@/components/ui/typography";
import { useIOS } from "@/lib/use-ios";

const CHAVE_DISPENSADO = "tapgym-atalho-dispensado";
/** Evita reabrir o modal a cada refresh sem dispensar o card. */
const CHAVE_MODAL_VISTO = "tapgym-atalho-modal-visto";

/**
 * Convite pra instalar o atalho, no topo do Dashboard.
 *
 * Existe porque a feature não tinha descoberta nenhuma: era um ícone de raio sem
 * rótulo no header, e é justamente o diferencial que a LP anuncia e que a
 * assinatura paga.
 *
 * Só aparece em iOS (Atalhos não existe no Android) e some pra sempre quando
 * dispensado. O "pra sempre" é por dispositivo, via localStorage, e isso está
 * certo: o atalho também é instalado por dispositivo, então quem tem iPhone e
 * iPad precisa do convite nos dois.
 *
 * Na primeira visita o ShortcutDialog abre sozinho (conta nova com treino
 * seedado); o card continua disponível se a pessoa só fechou o modal.
 *
 * Quem chama deve renderizar só quando já existe treino cadastrado. Sem treino
 * com semana definida o atalho não acha o treino de hoje, e o convite viraria
 * uma instrução impossível de concluir.
 */
export function AtalhoCard() {
  const ehIOS = useIOS();
  // undefined enquanto não leu o localStorage, pelo mesmo motivo do useIOS.
  const [dispensado, setDispensado] = useState<boolean | undefined>(undefined);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  useEffect(() => {
    if (ehIOS !== true) return;

    let salvo = false;
    let modalVisto = false;
    try {
      salvo = window.localStorage.getItem(CHAVE_DISPENSADO) === "1";
      modalVisto = window.localStorage.getItem(CHAVE_MODAL_VISTO) === "1";
    } catch {
      // Modo privado / storage bloqueado: melhor mostrar o convite do que quebrar.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDispensado(salvo);
    if (!salvo && !modalVisto) {
      setDialogoAberto(true);
      try {
        window.localStorage.setItem(CHAVE_MODAL_VISTO, "1");
      } catch {
        // Sem persistência o modal pode reabrir no próximo load. Aceitável.
      }
    }
  }, [ehIOS]);

  function dispensar() {
    setDispensado(true);
    setDialogoAberto(false);
    try {
      window.localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // Sem persistência, o convite volta no próximo carregamento. Aceitável.
    }
  }

  if (!ehIOS || dispensado !== false) return null;

  return (
    <>
      <SoftCard className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="shrink-0 text-primary" aria-hidden="true" />
          <TypographyH4>Registre sem abrir o app</TypographyH4>
        </div>
        <TypographyMuted className="max-w-[34ch]">
          Um atalho na tela de início do iPhone salva a série entre um descanso e outro.
        </TypographyMuted>
        <div className="mt-1 flex items-center gap-2">
          <Button onClick={() => setDialogoAberto(true)} className="h-11 flex-1 rounded-xl font-bold">
            Como instalar
          </Button>
          <Button variant="ghost" onClick={dispensar} className="h-11 rounded-xl px-4 text-[13px]">
            Depois
          </Button>
        </div>
      </SoftCard>

      <ShortcutDialog open={dialogoAberto} onOpenChange={setDialogoAberto} />
    </>
  );
}
