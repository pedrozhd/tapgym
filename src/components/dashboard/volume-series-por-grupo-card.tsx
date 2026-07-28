import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import { LABEL_GRUPO_MUSCULAR } from "@/lib/grupos-musculares";
import type { VolumeGrupoSemana } from "@/lib/types";

interface Props {
  volumes: VolumeGrupoSemana[];
  exerciciosSemGrupo: number;
}

// Barra proporcional ao líder do ranking. Um grupamento com 1 série contra um
// líder de 20 daria 5% de largura, um traço fino demais pra ser lido como
// barra — daí o piso.
const LARGURA_MINIMA_PCT = 6;
/** Cascata na entrada das barras (ms por linha). */
const ATRASO_POR_LINHA = 40;

export function VolumeSeriesPorGrupoCard({ volumes, exerciciosSemGrupo }: Props) {
  const totalSeries = volumes.reduce((soma, item) => soma + item.series, 0);
  const maxSeries = volumes.reduce((maior, item) => Math.max(maior, item.series), 0);

  return (
    <SoftCard className="flex flex-col gap-3.5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <TypographyEyebrow>Volume semanal</TypographyEyebrow>
          <p className="mt-1 text-lg font-bold leading-none">Séries por grupamento</p>
        </div>
        {totalSeries > 0 && (
          <p className="shrink-0 text-2xl leading-none font-bold tabular-nums">
            {totalSeries}
            <span className="ml-1 align-baseline text-[11px] font-bold uppercase text-muted-foreground">
              séries
            </span>
          </p>
        )}
      </div>

      {volumes.length === 0 ? (
        <TypographyMuted className="py-3 text-center">
          Nenhuma série com grupamento esta semana.
        </TypographyMuted>
      ) : (
        <ul className="flex flex-col gap-3">
          {volumes.map((item, index) => {
            // `volumes` já vem ordenado desc, então empate no topo destaca as
            // duas linhas — que é o certo: as duas lideram de fato.
            const lider = item.series === maxSeries;
            const largura = Math.max(LARGURA_MINIMA_PCT, (item.series / maxSeries) * 100);
            return (
              <li key={item.grupo} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate font-medium">{LABEL_GRUPO_MUSCULAR[item.grupo]}</span>
                  <span className={`shrink-0 font-bold tabular-nums ${lider ? "text-primary" : ""}`}>
                    {item.series}
                  </span>
                </div>
                {/* Decoração: o número ao lado do rótulo já dá o valor exato a
                    quem usa leitor de tela, e a barra sozinha não seria lida. */}
                <div aria-hidden className="h-1.5 rounded-full bg-border">
                  <div
                    className={`rg-bar-grow h-full rounded-full ${
                      lider ? "bg-primary shadow-[0_0_10px_-1px_var(--primary)]" : "bg-primary/30"
                    }`}
                    style={{ animationDelay: `${index * ATRASO_POR_LINHA}ms`, width: `${largura}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {exerciciosSemGrupo > 0 && (
        <TypographyMuted className="border-t border-border pt-2.5">
          {exerciciosSemGrupo === 1
            ? "1 exercício sem grupamento"
            : `${exerciciosSemGrupo} exercícios sem grupamento`}
        </TypographyMuted>
      )}
    </SoftCard>
  );
}
