/**
 * Guarda de CSRF para POST autenticado por cookie. A defesa que já existe
 * (cookie de sessão `SameSite=Lax`) não cobre um subdomínio sob controle de
 * terceiro em `*.tapgym.com.br` (same-site, mas não same-origin) nem
 * navegador antigo sem suporte a `SameSite`. `sec-fetch-site` é o sinal mais
 * confiável (enviado pelo navegador, não pelo cliente); `Origin` é o
 * fallback. Sem nenhum dos dois, nega: um POST de verdade, disparado pela
 * própria página, sempre carrega um dos dois em navegadores atuais.
 */
export function mesmaOrigem(request: Request): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) return secFetchSite === "same-origin" || secFetchSite === "none";

  const origin = request.headers.get("origin");
  if (origin) return origin === new URL(request.url).origin;

  return false;
}
