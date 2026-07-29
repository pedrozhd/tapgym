/**
 * O default do `@supabase/ssr` (`{ sameSite: "lax", httpOnly: false }`) não
 * inclui `secure`, então o cookie de sessão (access + refresh token) viajaria
 * em texto claro numa requisição http:// para o domínio. `false` em dev
 * porque localhost não tem HTTPS.
 */
export const SUPABASE_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
};
