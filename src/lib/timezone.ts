/**
 * Fuso horário fixo do app. Toda lógica de "que dia é hoje" ou "essa série
 * foi registrada hoje/ontem" precisa passar por aqui em vez de usar os
 * getters locais do Date (Date.getDay(), toDateString() etc.), esses usam o
 * fuso do runtime que executa o código, que na Vercel é UTC, não o do usuário.
 *
 * TODO(multiusuário): quando existir mais de um usuário em fusos diferentes,
 * trocar este valor fixo por um `profiles.timezone` por usuário (ex: buscar
 * do perfil e passar como parâmetro `timeZone` nas funções abaixo, em vez de
 * depender do default `APP_TIMEZONE`).
 */
export const APP_TIMEZONE = "America/Sao_Paulo";

const DIA_SEMANA_POR_ABREVIACAO: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Dia da semana (0 = domingo ... 6 = sábado) de `data`, como observado no
 * fuso `timeZone`, não no fuso do runtime. Usa Intl.DateTimeFormat (ICU),
 * que já lida com horário de verão e demais regras de cada fuso.
 */
export function getDiaSemanaNoFuso(data: Date, timeZone: string = APP_TIMEZONE): number {
  const abreviacao = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(data);
  return DIA_SEMANA_POR_ABREVIACAO[abreviacao];
}

/**
 * Data civil (YYYY-MM-DD) de `data` no fuso `timeZone`. Duas datas caem no
 * "mesmo dia" nesse fuso se, e somente se, esta função retornar o mesmo
 * valor para as duas.
 */
export function getDataLocalISO(data: Date, timeZone: string = APP_TIMEZONE): string {
  // Safari às vezes prefixa LTR/RTL mark no format(); Postgres `date` rejeita.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(data)
    .replace(/[\u200e\u200f]/g, "");
}

/**
 * Recorta YYYY-MM-DD de um `date` do PostgREST. Não passe pelo `Date`:
 * `"2026-08-20T00:00:00.000Z"` viraria dia 19 em America/Sao_Paulo.
 */
export function dataCivilISO(valor: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(valor);
  return m ? m[1] : valor;
}
