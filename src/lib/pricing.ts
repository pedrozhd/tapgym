/**
 * Apresentação do plano — usada pela LP e pela tela `/assinar`.
 *
 * Isto é só texto: a cobrança real é o `STRIPE_PRICE_ID`. Ao mudar o preço no
 * Stripe, atualize `preco` aqui também, senão a LP passa a anunciar um valor
 * diferente do que o checkout cobra.
 */
export const PLANO = {
  nome: "Mensal",
  preco: "R$ 9,90",
  periodo: "por mês",
  /** Copy do teste gratuito — cadastro entra no app sem cartão (Cérebro §3). */
  trial: "7 dias grátis, sem cartão",
  beneficios: [
    "Registro ilimitado de séries",
    "Histórico e gráficos por exercício",
    "Treinos e dias sem limite",
    "Cancele quando quiser",
  ],
} as const;
