import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow } from "@/components/ui/typography";
import { formatCarga, parseCarga } from "@/lib/dashboard";

const PASSO_CARGA = 2.5;

interface CargaCardProps {
  carga: number;
  onChange: (carga: number) => void;
}

export function CargaCard({ carga, onChange }: CargaCardProps) {
  // Estado de texto separado do número: com `value={String(carga)}` puro, "17,"
  // vira 17 (parseFloat descarta a vírgula solta) e o input reescreve "17" no
  // lugar do que a pessoa acabou de digitar, comendo o dígito seguinte. Aqui só
  // resincroniza o texto quando `carga` mudou por fora da digitação (botões
  // +/- ou troca de exercício) — comparado contra o número que a própria
  // digitação já produziu, então um "17," no meio da edição não é sobrescrito.
  const [texto, setTexto] = useState(carga === 0 ? "" : formatCarga(carga));
  const [cargaSincronizada, setCargaSincronizada] = useState(carga);

  if (carga !== cargaSincronizada) {
    setCargaSincronizada(carga);
    setTexto(carga === 0 ? "" : formatCarga(carga));
  }

  function onTextoChange(valor: string) {
    setTexto(valor);
    const nova = parseCarga(valor);
    setCargaSincronizada(nova);
    onChange(nova);
  }

  return (
    <SoftCard className="flex flex-col gap-3 p-4">
      <TypographyEyebrow>CARGA (KG)</TypographyEyebrow>
      <div className="flex items-stretch gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, Math.round((carga - PASSO_CARGA) * 10) / 10))}
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-input bg-secondary text-2xl text-foreground"
          aria-label="Diminuir carga"
        >
          −
        </button>
        <Input
          value={texto}
          onChange={(e) => onTextoChange(e.target.value)}
          onBlur={() => setTexto(carga === 0 ? "" : formatCarga(carga))}
          inputMode="decimal"
          placeholder="0"
          className="h-[60px] flex-1 border-none bg-transparent px-0 text-center text-4xl font-extrabold tracking-tight shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <button
          type="button"
          onClick={() => onChange(Math.round((carga + PASSO_CARGA) * 10) / 10)}
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-input bg-secondary text-2xl text-foreground"
          aria-label="Aumentar carga"
        >
          +
        </button>
      </div>
    </SoftCard>
  );
}
