/**
 * Regra única de "pode usar o app": assinatura ativa, teste vigente, ou isenção
 * vitalícia (contas anteriores à migração 0008).
 *
 * Estava reescrita à mão no middleware e na rota de checkout, e faltava por
 * completo nas rotas do Shortcut (`/api/hoje`, `/api/registrar`) que usam a
 * service role key e portanto não passam por RLS nem pelo middleware. O efeito
 * era que quem cancelava a assinatura perdia as páginas mas seguia registrando
 * séries pelo atalho indefinidamente.
 *
 * Como a regra vive aqui, o teste de 7 dias (migração 0012) passou a valer nos
 * quatro pontos de uma vez, incluindo o atalho.
 */
export interface PerfilAcesso {
  is_legacy_free?: boolean | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
}

/** Colunas que precisam estar no `select` pra `temAcesso` decidir. */
export const COLUNAS_ACESSO = "is_legacy_free, subscription_status, trial_ends_at";

/** `true` enquanto o teste gratuito ainda não venceu. */
export function trialVigente(perfil: PerfilAcesso | null | undefined): boolean {
  if (!perfil?.trial_ends_at) return false;
  const fim = new Date(perfil.trial_ends_at).getTime();
  return Number.isFinite(fim) && fim > Date.now();
}

export function temAcesso(perfil: PerfilAcesso | null | undefined): boolean {
  return (
    Boolean(perfil?.is_legacy_free) ||
    perfil?.subscription_status === "active" ||
    trialVigente(perfil)
  );
}

/** Dias inteiros que faltam do teste. 0 quando não há teste vigente. */
export function diasRestantesTrial(perfil: PerfilAcesso | null | undefined): number {
  if (!trialVigente(perfil)) return 0;
  const restante = new Date(perfil!.trial_ends_at!).getTime() - Date.now();
  return Math.max(1, Math.ceil(restante / 86_400_000));
}
