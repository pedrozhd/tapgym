import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_ACESSO, temAcesso, type PerfilAcesso } from "@/lib/acesso";
import { falha, rotaAtalho, sucesso } from "@/lib/atalho";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";
import type { Qualidade } from "@/lib/types";

const QUALIDADES: Qualidade[] = ["boa", "razoavel", "ruim"];

interface RegistrarBody {
  token: string;
  exercicio_id: string;
  carga: number | string;
  reps: number | string;
  qualidade: Qualidade;
}

/**
 * POST /api/registrar — registra uma série vinda do Shortcut do iOS.
 * `token` é o `profiles.api_token` de cada usuário.
 *
 * A tabela `series` não guarda user_id (posse é só via exercicio_id ->
 * exercicios.user_id). Como esta rota usa a service role key, que ignora RLS,
 * é a checagem abaixo — não o banco — que impede um token válido de gravar
 * uma série em um exercício de outro usuário.
 *
 * Responde sempre 200, com erro no corpo. Ver `src/lib/atalho.ts`.
 */
export const POST = rotaAtalho(async (request: NextRequest) => {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return falha(429, "Muitas requisições, tente novamente em instantes");
  }

  const body = (await request.json().catch(() => null)) as Partial<RegistrarBody> | null;

  const carga = body?.carga != null ? Number(body.carga) : NaN;
  const reps = body?.reps != null ? Number(body.reps) : NaN;

  if (
    !body?.token ||
    !body.exercicio_id ||
    !Number.isFinite(carga) ||
    carga <= 0 ||
    !Number.isFinite(reps) ||
    reps <= 0 ||
    !body.qualidade ||
    !QUALIDADES.includes(body.qualidade)
  ) {
    // Campos e valores como o usuário vê no atalho, não como o JSON manda: o
    // Atalhos mostra esta frase crua num alerta, e a qualidade vem de um menu
    // "Boa / Razoável / Ruim". Os valores que a API aceita de fato
    // (boa | razoavel | ruim) estão no contrato, em docs/CEREBRO.md.
    return falha(
      400,
      "Campos obrigatórios: Token, Exercício, Carga > 0, Repetições > 0, Qualidade (Boa, Razoável ou Ruim)",
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(`id, ${COLUNAS_ACESSO}`)
    .eq("api_token", body.token)
    .maybeSingle<PerfilAcesso & { id: string }>();
  if (!profile) {
    return falha(401, "Token inválido");
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui — senão o atalho continua
  // gravando séries depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(profile)) {
    return falha(402, "Assinatura inativa, reative no app");
  }

  // Segunda cota, agora pelo token. A de cima é por IP, e um token compartilhado
  // entre pessoas em redes diferentes ganharia uma cota independente para cada
  // uma. Limitando o token, quem compartilha divide a mesma cota.
  const porToken = await checkRateLimit(`token:${profile.id}`);
  if (!porToken.success) {
    return falha(429, "Muitas requisições, tente novamente em instantes");
  }

  const { data: exercicio } = await admin
    .from("exercicios")
    .select("id")
    .eq("id", body.exercicio_id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!exercicio) {
    return falha(404, "Exercício não encontrado");
  }

  const { error } = await admin
    .from("series")
    .insert({ exercicio_id: body.exercicio_id, carga, reps, qualidade: body.qualidade });

  if (error) {
    // A mensagem do Postgres vai pro log, não pra tela: no formato novo o campo
    // `error` é exatamente o texto que o atalho mostra ao usuário.
    return falha(500, "Não deu para salvar a série, tente novamente", error.message);
  }

  return sucesso({});
});
