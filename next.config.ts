import type { NextConfig } from "next";

const SUPABASE_ORIGIN = "https://otqcniepbpphsdqyujvg.supabase.co";
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

// Validada em produção via DevTools (Console) sem nenhuma violação: os únicos
// itens que apareceram (preload malformado, ERR_NAME_NOT_RESOLVED em
// m.stripe.com) são da própria página hospedada do Stripe Checkout, outra
// origem, com a CSP dela — não afetados por esta.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${TURNSTILE_ORIGIN}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${TURNSTILE_ORIGIN}`,
  `frame-src ${TURNSTILE_ORIGIN}`,
  "object-src 'none'",
  "base-uri 'self'",
  // 'self' sozinho barra o resultado do form: /api/stripe/checkout e
  // /api/stripe/portal respondem 303 para o Stripe (checkout.stripe.com,
  // billing.stripe.com), e o Safari/WebKit aplica form-action também ao
  // redirect final, não só ao destino inicial do <form>. Sem isso, o clique
  // em "Assinar"/"Gerenciar assinatura" nunca saía do lugar.
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
