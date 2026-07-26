import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

/**
 * POST /api/token/rotate — gera um novo `profiles.api_token` para o usuário logado.
 *
 * Precisa de rota (e da service role) porque o cliente não pode escrever nessa
 * coluna: o schema faz `revoke update on profiles from authenticated` e devolve
 * só `grant update (nome)`. Sem isso, um token vazado seria permanente, e o
 * token vale acesso pago desde que o paywall passou a valer nas rotas do atalho.
 *
 * Mesmo formato do default da coluna (0003): 24 bytes aleatórios em hex.
 */
export async function POST(request: NextRequest) {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json({ error: "muitas requisições, tente novamente em instantes" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const novoToken = randomBytes(24).toString("hex");

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ api_token: novoToken }).eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ api_token: novoToken });
}
