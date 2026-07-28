"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppHeader } from "@/components/layout/app-header";
import { EditarSerieDialog } from "@/components/registro/editar-serie-dialog";
import { QualidadeIcon } from "@/components/registro/qualidade-icon";
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyEyebrow, TypographyMuted, TypographySectionTitle } from "@/components/ui/typography";
import { formatCarga } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";
import { APP_TIMEZONE } from "@/lib/timezone";
import type { Serie } from "@/lib/types";

function formatDataSerie(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: APP_TIMEZONE })
    .format(new Date(iso))
    .replace(".", "");
}

export default function ExercicioHistoricoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { exercicios, series, loading, updateSerie, removeSerie } = useAppStore();
  const [serieEditando, setSerieEditando] = useState<Serie | null>(null);

  const exercicio = exercicios.find((e) => e.id === params.id);
  const seriesAntigaPrimeiro = series
    .filter((s) => s.exercicio_id === params.id)
    .sort((a, b) => a.data.localeCompare(b.data));
  const seriesRecentePrimeiro = [...seriesAntigaPrimeiro].reverse();

  if (loading) {
    return (
      <>
        <AppHeader variant="back" title="Histórico" onBack={() => router.back()} />
        <main className="flex flex-1 items-center justify-center px-8">
          <TypographyMuted className="text-center">Carregando...</TypographyMuted>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="back" title={exercicio?.nome || "Exercício"} onBack={() => router.back()} />
      {/* pt-6: espaço pro brilho do shadow-soft-elevated do primeiro card não
          ser cortado pela borda deste container com overflow (ver dashboard/page.tsx). */}
      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-6 pb-6">
        {seriesRecentePrimeiro.length === 0 ? (
          <TypographyMuted className="flex-1 py-10 text-center">
            Nenhuma série registrada ainda para este exercício.
          </TypographyMuted>
        ) : (
          <>
            <SoftCard className="p-4">
              <div className="flex items-center justify-between gap-3">
                <TypographyEyebrow>CARGA E REPETIÇÕES</TypographyEyebrow>
                <div className="flex shrink-0 items-center gap-3 text-[11px] font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Carga
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-info" />
                    Reps
                  </span>
                </div>
              </div>
              <div className="mt-3 h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={seriesAntigaPrimeiro} margin={{ top: 16, right: 10, bottom: 8, left: 10 }}>
                    <XAxis dataKey="data" hide />
                    <YAxis yAxisId="carga" hide domain={["dataMin - 5", "dataMax + 5"]} />
                    <YAxis yAxisId="reps" orientation="right" hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--popover-foreground)",
                      }}
                      labelFormatter={(value) => formatDataSerie(String(value))}
                      formatter={(value, name) =>
                        name === "reps"
                          ? [`${value} reps`, "Repetições"]
                          : [`${formatCarga(Number(value ?? 0))} kg`, "Carga"]
                      }
                    />
                    <Line
                      yAxisId="carga"
                      type="monotone"
                      dataKey="carga"
                      // var(--primary), não hex: o hex fixo era o verde do tema
                      // claro (morto), então a linha saía verde enquanto a
                      // bolinha da legenda usa bg-primary e é lima no dark.
                      stroke="var(--primary)"
                      strokeWidth={2}
                      style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
                      dot={(props: { cx?: number; cy?: number; index?: number }) => {
                        const isLast = props.index === seriesAntigaPrimeiro.length - 1;
                        if (!isLast || props.cx == null || props.cy == null) return <g key={props.index} />;
                        return (
                          <circle
                            key={props.index}
                            cx={props.cx}
                            cy={props.cy}
                            r={3}
                            fill="var(--primary)"
                            style={{ filter: "drop-shadow(0 0 5px var(--primary))" }}
                          />
                        );
                      }}
                      activeDot={{ r: 4, fill: "var(--primary)" }}
                    />
                    <Line
                      yAxisId="reps"
                      type="monotone"
                      dataKey="reps"
                      stroke="var(--info)"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={false}
                      activeDot={{ r: 4, fill: "var(--info)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SoftCard>

            <section className="flex flex-col gap-2.5">
              <TypographySectionTitle>Todas as séries ({seriesRecentePrimeiro.length})</TypographySectionTitle>
              <div className="flex flex-col gap-2">
                {/* A linha inteira abre a edição (que também apaga). Antes eram
                    dois botões de ícone de 14 e 15px, sem padding e a 8px um do
                    outro — o de apagar era destrutivo. */}
                {seriesRecentePrimeiro.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSerieEditando(s)}
                    aria-label={`Editar série de ${formatDataSerie(s.data)}: ${formatCarga(s.carga)} kg por ${s.reps} repetições`}
                    className="shadow-soft-subtle flex min-h-11 w-full items-center justify-between rounded-xl bg-card px-4 py-3 text-left active:opacity-70"
                  >
                    <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{formatDataSerie(s.data)}</span>
                    <span className="flex-1 text-center text-[15px] font-bold">{formatCarga(s.carga)} kg</span>
                    <span className="flex shrink-0 items-center justify-end gap-2">
                      <span className="text-[13px] text-muted-foreground">× {s.reps}</span>
                      <QualidadeIcon qualidade={s.qualidade} />
                      <Pencil size={14} className="text-muted-foreground" aria-hidden="true" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <EditarSerieDialog
        serie={serieEditando}
        onOpenChange={(open) => !open && setSerieEditando(null)}
        onSave={(serieId, carga, reps, qualidade) => updateSerie(serieId, carga, reps, qualidade)}
        onDelete={removeSerie}
      />
    </>
  );
}
