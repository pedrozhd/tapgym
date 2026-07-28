import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow, TypographyH1, TypographyMuted } from "@/components/ui/typography";
import type { ProgressoDoDia } from "@/lib/dashboard";

interface Props {
  treino: { nome: string; totalExercicios: number };
  progresso: ProgressoDoDia;
}

// Sem CTA pro /registro: o público é de iPhone e registra pelo atalho do iOS,
// então o botão ocupava o maior peso visual do dashboard por um caminho que
// quase ninguém usa (a aba Registro na bottom nav continua dando acesso). O
// lugar dele virou o progresso do dia, que é a pergunta que a tela não
// respondia: quanto falta pra fechar o treino.
export function TreinoDeHojeCard({ treino, progresso }: Props) {
  const exerciciosLabel = `${treino.totalExercicios} ${
    treino.totalExercicios === 1 ? "exercício" : "exercícios"
  }`;
  const pctConcluido = progresso.total > 0 ? (progresso.feitas / progresso.total) * 100 : 0;

  return (
    <SoftCard className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <TypographyEyebrow className="text-primary">TREINO DE HOJE</TypographyEyebrow>
          <TypographyH1 className="mt-1">{treino.nome}</TypographyH1>
          <TypographyMuted className="mt-0.5">{exerciciosLabel}</TypographyMuted>
        </div>
        {progresso.total > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-2xl leading-none font-bold tabular-nums">
              {progresso.feitas}
              <span className="text-muted-foreground">/{progresso.total}</span>
            </p>
            <p className="mt-1.5 text-[11px] font-bold uppercase text-muted-foreground">séries hoje</p>
          </div>
        )}
      </div>

      {progresso.total > 0 && (
        // Decoração: a contagem acima já dá o número exato pra leitor de tela.
        <div aria-hidden className="h-1.5 rounded-full bg-border">
          <div className="rg-bar-grow h-full rounded-full bg-primary" style={{ width: `${pctConcluido}%` }} />
        </div>
      )}
    </SoftCard>
  );
}
