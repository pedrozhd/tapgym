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
  const { trialEndsAt, subscriptionStatus, isLegacyFree, loading } = useAppStore();
  // Precisa do status da assinatura: `trial_ends_at` continua no futuro depois
  // do pagamento, e sem isso o aviso ficava na tela de quem já assinou.
  const dias = diasRestantesTrial({
    trial_ends_at: trialEndsAt,
    subscription_status: subscriptionStatus,
    is_legacy_free: isLegacyFree,
  });

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

      {/* Sempre presente, não só na urgência: escondê-lo nos primeiros dias
          tirava o único caminho contextual pra quem decidiu pagar antes do prazo.
          O que escala é a cor, não a existência do botão.

          Vai direto pro checkout, igual aos CTAs da LP: "Assinar" que leva a
          outra tela com outro "Assinar" é redundante. */}
      <form action="/api/stripe/checkout" method="POST" className="shrink-0">
        <button
          type="submit"
          className="-my-2.5 flex min-h-11 items-center font-bold underline underline-offset-4 active:opacity-70"
        >
          Assinar
        </button>
      </form>
    </div>
  );
}
