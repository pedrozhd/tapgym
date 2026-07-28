import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import type { ExercicioEvolucao } from "@/lib/dashboard";

interface Props {
  dados: ExercicioEvolucao | null;
}

export function ExercicioMaisEvoluidoCard({ dados }: Props) {
  if (!dados) {
    return (
      <SoftCard className="flex flex-col gap-2.5 p-4">
        <TypographyEyebrow>MAIOR EVOLUÇÃO</TypographyEyebrow>
        <TypographyMuted className="py-5 text-center">
          Registre pelo menos 2 sessões de um exercício pra ver sua evolução aqui
        </TypographyMuted>
      </SoftCard>
    );
  }

  const subiu = dados.deltaPercentual >= 0;
  const corTendencia = subiu ? "text-success" : "text-destructive";
  const IconeTendencia = subiu ? ArrowUpRight : ArrowDownLeft;

  return (
    <Link href={`/exercicio/${dados.exercicioId}`} className="block active:opacity-80">
      <SoftCard className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <TypographyEyebrow>MAIOR EVOLUÇÃO</TypographyEyebrow>
            {/* leading-tight, não leading-none: o overflow-hidden do truncate
                corta os descendentes quando a linha tem a altura exata da fonte. */}
            <p className="mt-1 truncate text-lg font-bold leading-tight">{dados.nome}</p>
            <TypographyMuted className="mt-1">
              Volume de {Math.round(dados.volumeInicial)} kg pra {Math.round(dados.volumeAtual)} kg
            </TypographyMuted>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className={`grid grid-cols-[14px_auto] items-center gap-0.5 text-sm font-bold tabular-nums ${corTendencia}`}>
              <IconeTendencia aria-hidden size={14} strokeWidth={2.5} />
              <span>{Math.abs(Math.round(dados.deltaPercentual))}%</span>
            </div>
            <ChevronRight size={18} className="text-muted-foreground/60" />
          </div>
        </div>
      </SoftCard>
    </Link>
  );
}
