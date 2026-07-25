/**
 * Regra única de "pode usar o app": assinatura ativa ou isenção vitalícia
 * (contas anteriores à migração 0008).
 *
 * Estava reescrita à mão no middleware e na rota de checkout, e faltava por
 * completo nas rotas do Shortcut (`/api/hoje`, `/api/registrar`) — que usam a
 * service role key e portanto não passam por RLS nem pelo middleware. O efeito
 * era que quem cancelava a assinatura perdia as páginas mas seguia registrando
 * séries pelo atalho indefinidamente.
 */
export interface PerfilAcesso {
  is_legacy_free?: boolean | null;
  subscription_status?: string | null;
}

/** Colunas que precisam estar no `select` pra `temAcesso` decidir. */
export const COLUNAS_ACESSO = "is_legacy_free, subscription_status";

export function temAcesso(perfil: PerfilAcesso | null | undefined): boolean {
  return Boolean(perfil?.is_legacy_free) || perfil?.subscription_status === "active";
}
