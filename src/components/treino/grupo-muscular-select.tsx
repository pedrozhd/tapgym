"use client";

import { ChevronDown } from "lucide-react";
import {
  GRUPOS_MUSCULARES,
  LABEL_GRUPO_MUSCULAR,
  REGIAO_GRUPO_MUSCULAR,
  type RegiaoMuscular,
} from "@/lib/grupos-musculares";
import type { GrupoMuscular } from "@/lib/types";

/**
 * Cor por região, não por grupamento: treze cores distintas viram confete num
 * app que é lime sobre preto, e quatro famílias ainda deixam bater o olho na
 * lista e ver se o treino puxou, empurrou ou foi de perna. Tons -300 pra ter
 * contraste AAA sobre o fundo escuro, e o nome está sempre escrito — a cor
 * reforça, nunca é o único sinal.
 */
const CLASSES_REGIAO: Record<RegiaoMuscular, string> = {
  empurrar: "bg-sky-500/15 text-sky-300",
  puxar: "bg-violet-500/15 text-violet-300",
  pernas: "bg-orange-500/15 text-orange-300",
  core: "bg-rose-500/15 text-rose-300",
};

const CLASSES_SEM_GRUPO = "bg-secondary text-muted-foreground";

interface Props {
  value: GrupoMuscular | null;
  onChange: (grupo: GrupoMuscular) => void;
}

export function GrupoMuscularSelect({ value, onChange }: Props) {
  const classes = value ? CLASSES_REGIAO[REGIAO_GRUPO_MUSCULAR[value]] : CLASSES_SEM_GRUPO;

  return (
    // O <select> nativo segue sendo o controle real, só invisível por cima do
    // badge — no iPhone isso abre o seletor nativo do iOS, melhor que qualquer
    // dropdown desenhado à mão. O badge não pode ser o próprio <select> porque
    // o Chrome dimensiona select pela opção mais larga ("Posterior de coxa"),
    // e o badge precisa ter a largura do rótulo atual.
    <span className="relative inline-flex w-fit">
      <select
        aria-label="Grupamento muscular"
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value as GrupoMuscular);
        }}
        // -inset-y-2 estica só a área de toque: o badge tem 28px de altura, o
        // alvo fica com 44px sem mudar o visual.
        className="peer absolute inset-x-0 -inset-y-2 z-10 cursor-pointer appearance-none opacity-0"
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
      <span
        aria-hidden
        className={`pointer-events-none inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] leading-none font-semibold peer-active:opacity-70 peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${classes}`}
      >
        {value ? LABEL_GRUPO_MUSCULAR[value] : "Escolher grupamento"}
        <ChevronDown className="opacity-60" size={13} />
      </span>
    </span>
  );
}
