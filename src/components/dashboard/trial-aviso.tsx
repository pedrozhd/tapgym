"use client";

import { diasRestantesTrial } from "@/lib/acesso";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Contador do teste gratuito, em uma linha, no topo do Dashboard.
 *
 * Existe porque o teste trancava o app em silêncio: no oitavo dia a pessoa
 * batia no paywall sem nenhum aviso prévio, o que é a mesma agressividade que o
 * teste veio remover, só adiada. Ficava só na AccountSheet, atrás do avatar.
 *
 * Deliberadamente discreto: uma linha de texto, sem card e sem borda, pra não
 * competir com o treino do dia. Nos dois últimos dias ganha cor de alerta e o
 * atalho pra assinar, porque aí a informação passou a ser urgente.
 */
export function TrialAviso() {
  const { trialEndsAt, loading } = useAppStore();
  const dias = diasRestantesTrial({ trial_ends_at: trialEndsAt });

  if (loading || dias === 0) return null;

  const urgente = dias <= 2;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-[13px]",
        urgente ? "text-warning" : "text-muted-foreground",
      )}
    >
      <span>
        {dias === 1 ? "Último dia do seu teste gratuito." : `Teste gratuito: ${dias} dias restantes.`}
      </span>

      {/* Só nos últimos dois dias, e vai direto pro checkout, igual aos CTAs da
          LP: "Assinar" que leva a outra tela com outro "Assinar" é redundante. */}
      {urgente && (
        <form action="/api/stripe/checkout" method="POST" className="shrink-0">
          <button
            type="submit"
            className="-my-2.5 flex min-h-11 items-center font-bold underline underline-offset-4 active:opacity-70"
          >
            Assinar
          </button>
        </form>
      )}
    </div>
  );
}
