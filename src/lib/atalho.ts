import { NextResponse, type NextRequest } from "next/server";

/**
 * Formato de resposta das rotas do Shortcut (`/api/hoje`, `/api/registrar`).
 *
 * As duas respondem **sempre 200** e sinalizam erro pelo corpo. O motivo é o
 * cliente: o "Obter Conteúdo de URL" do app Atalhos não expõe o status HTTP em
 * nenhuma variável do fluxo, então uma API que sinaliza erro por status code
 * chega ao usuário como alerta genérico do sistema, mesmo mandando um `error`
 * descritivo no corpo. Uma API consumida por um cliente que não sabe ramificar
 * em status code não deveria sinalizar erro por status code.
 *
 * O atalho ramifica pelo campo `error` ("tem algum valor"), não pelo `ok`:
 * booleano de JSON vira 1/0 no Atalhos e a comparação é instável entre versões
 * do iOS. `ok` e `code` existem para log e para qualquer cliente futuro que
 * saiba ler mais que texto.
 */

/** `200 { ok: true, ...data }`. O payload de sucesso não mudou de forma. */
export function sucesso<T extends object>(data: T = {} as T) {
  return NextResponse.json({ ok: true, ...data });
}

/**
 * `200 { ok: false, code, error }`.
 *
 * `error` é texto que aparece na tela do usuário: nunca passe mensagem de
 * banco ou de exceção aqui, use `detalhe` para isso. O Atalhos mostra o valor
 * cru num alerta, então escreva como frase, com maiúscula inicial e nomes de
 * campo em português, não os nomes do JSON. Responder sempre 200
 * apaga a taxa de erro dos painéis da Vercel, que só enxergam status; o log e
 * o header devolvem essa visibilidade.
 */
export function falha(code: number, error: string, detalhe?: unknown) {
  const log = code >= 500 ? console.error : console.warn;
  log(`[atalho] ${code}: ${error}`, detalhe ?? "");

  return NextResponse.json(
    { ok: false, code, error },
    { headers: { "X-Error-Code": String(code) } },
  );
}

type RotaAtalho = (request: NextRequest) => Promise<NextResponse>;

/**
 * Garante que nem exceção escapa como 500 com corpo HTML. Sem isto, o cenário
 * de erro mais provável (Supabase fora, env faltando) é justamente o que volta
 * a chegar ao usuário como alerta genérico.
 */
export function rotaAtalho(handler: RotaAtalho): RotaAtalho {
  return async (request) => {
    try {
      return await handler(request);
    } catch (erro) {
      return falha(500, "Erro no servidor, tente novamente", erro);
    }
  };
}
