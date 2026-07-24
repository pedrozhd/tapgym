"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AccountSheet } from "@/components/layout/account-sheet";
import { Button } from "@/components/ui/button";
import { ExercicioEmFocoCard } from "@/components/dashboard/exercicio-em-foco-card";
import { ExercicioGrid } from "@/components/dashboard/exercicio-grid";
import { ExercicioMaisEvoluidoCard } from "@/components/dashboard/exercicio-mais-evoluido-card";
import { TreinoDeHojeCard } from "@/components/dashboard/treino-de-hoje-card";
import { VolumeSeriesPorGrupoCard } from "@/components/dashboard/volume-series-por-grupo-card";
import { SoftCard } from "@/components/ui/soft-card";
import { TypographyH4, TypographyMuted } from "@/components/ui/typography";
import { getDashboardData } from "@/lib/dashboard";
import { useAppStore } from "@/lib/store";

export default function DashboardPage() {
  const { treinos, treinoExercicios, exercicios, series, loading, userEmail, nome, updateNome } = useAppStore();
  const [contaAberta, setContaAberta] = useState(false);

  // Enquanto carrega, userEmail já chega (vem da sessão local) mas nome ainda
  // não (precisa de uma consulta à tabela profiles) — sem essa checagem, o
  // fallback pro e-mail aparecia por um instante a cada refresh, antes do
  // nome real carregar.
  const userName = loading
    ? ""
    : nome?.trim()
      ? nome.trim().split(" ")[0]
      : userEmail
        ? userEmail.split("@")[0]
        : "Você";

  return (
    <>
      <AppHeader variant="dashboard" userName={userName} onAvatarClick={() => setContaAberta(true)} />
      {/* pt-6: dá espaço pro brilho do shadow-soft-elevated do primeiro card se
          espalhar pra cima (offset -8px + blur 16px ≈ 24px) antes de esbarrar
          na borda deste container com overflow — sem esse respiro, o brilho é
          cortado em vez de esmaecer, e a aresta dura parece colada no header. */}
      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-6 pb-6">
        {loading ? (
          <TypographyMuted className="flex-1 py-10 text-center">Carregando...</TypographyMuted>
        ) : treinos.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <TypographyH4>Nenhum treino cadastrado ainda</TypographyH4>
            <TypographyMuted className="max-w-[26ch]">
              Crie seus treinos e defina sua semana para começar a registrar suas séries.
            </TypographyMuted>
            <Button render={<Link href="/treino" />} nativeButton={false} className="mt-2 h-11 rounded-xl px-5">
              Ir para Meu Treino
            </Button>
          </div>
        ) : (
          (() => {
            const dashboard = getDashboardData(treinos, treinoExercicios, exercicios, series);
            return (
              <>
                {dashboard.treino ? (
                  <>
                    <TreinoDeHojeCard treino={dashboard.treino} />
                    {dashboard.exercicioEmFoco ? (
                      <ExercicioEmFocoCard dados={dashboard.exercicioEmFoco} />
                    ) : (
                      <SoftCard className="flex flex-col items-center gap-1.5 p-6 text-center">
                        <TypographyH4>Treino de hoje concluído 💪</TypographyH4>
                        <TypographyMuted className="max-w-[28ch]">
                          Você bateu todas as séries de hoje. Bom trabalho.
                        </TypographyMuted>
                      </SoftCard>
                    )}
                    <ExercicioGrid exercicios={dashboard.exercicios} />
                    <VolumeSeriesPorGrupoCard
                      volumes={dashboard.volumeSeriesPorGrupo}
                      exerciciosSemGrupo={dashboard.exerciciosSemGrupo}
                    />
                  </>
                ) : (
                  <>
                    <SoftCard className="flex flex-col items-center gap-1.5 p-6 text-center">
                      <TypographyH4>Hoje é seu dia de descanso 🎉</TypographyH4>
                      <TypographyMuted className="max-w-[28ch]">
                        Nenhum treino está agendado para hoje. Ajuste sua semana em &ldquo;Meu Treino&rdquo;.
                      </TypographyMuted>
                    </SoftCard>
                    <ExercicioMaisEvoluidoCard dados={dashboard.exercicioMaisEvoluido} />
                    <VolumeSeriesPorGrupoCard
                      volumes={dashboard.volumeSeriesPorGrupo}
                      exerciciosSemGrupo={dashboard.exerciciosSemGrupo}
                    />
                  </>
                )}
              </>
            );
          })()
        )}
      </main>

      <AccountSheet
        open={contaAberta}
        onOpenChange={setContaAberta}
        email={userEmail}
        nome={nome}
        onUpdateNome={updateNome}
      />
    </>
  );
}
