import Link from "next/link";
import { SoftCard } from "@/components/ui/soft-card";
import { Sparkline } from "@/components/ui/sparkline";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import { formatCarga, type ExercicioEmFoco } from "@/lib/dashboard";

interface Props {
  dados: ExercicioEmFoco;
}

export function ExercicioEmFocoCard({ dados }: Props) {
  return (
    <Link href={`/exercicio/${dados.exercicioId}`} className="block active:opacity-80">
      <SoftCard className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <TypographyEyebrow>EM FOCO</TypographyEyebrow>
            {/* leading-tight, não leading-none: com line-height 1 a caixa da
                linha tem a altura exata da fonte e o overflow-hidden do
                truncate corta os descendentes ("g" de "Leg Press"). */}
            <p className="mt-1 truncate text-lg font-bold leading-tight">{dados.nome}</p>
          </div>
          {dados.cargaAtual !== null && (
            <p className="shrink-0 text-2xl leading-none font-bold tabular-nums">{formatCarga(dados.cargaAtual)} kg</p>
          )}
        </div>

        <TypographyMuted>
          {dados.seriesHoje} de {dados.numSeries} séries hoje
        </TypographyMuted>

        {dados.historico.length > 0 && (
          <Sparkline
            ariaLabel={`Histórico de carga de ${dados.nome}`}
            className="mt-1 text-primary"
            data={dados.historico.map((h) => ({ value: h.carga }))}
            glow
            height={56}
            showEndpoint
          />
        )}
      </SoftCard>
    </Link>
  );
}
