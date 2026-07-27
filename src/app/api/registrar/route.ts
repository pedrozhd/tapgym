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
    return falha(429, "muitas requisições, tente novamente em instantes");
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
    return falha(
      400,
      "campos obrigatórios: token, exercicio_id, carga > 0, reps > 0, qualidade (boa | razoavel | ruim)",
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(`id, ${COLUNAS_ACESSO}`)
    .eq("api_token", body.token)
    .maybeSingle<PerfilAcesso & { id: string }>();
  if (!profile) {
    return falha(401, "token inválido");
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui — senão o atalho continua
  // gravando séries depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(profile)) {
    return falha(402, "assinatura inativa, reative no app");
  }

  // Segunda cota, agora pelo token. A de cima é por IP, e um token compartilhado
  // entre pessoas em redes diferentes ganharia uma cota independente para cada
  // uma. Limitando o token, quem compartilha divide a mesma cota.
  const porToken = await checkRateLimit(`token:${profile.id}`);
  if (!porToken.success) {
    return falha(429, "muitas requisições, tente novamente em instantes");
  }

  const { data: exercicio } = await admin
    .from("exercicios")
    .select("id")
    .eq("id", body.exercicio_id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!exercicio) {
    return falha(404, "exercício não encontrado");
  }

  const { error } = await admin
    .from("series")
    .insert({ exercicio_id: body.exercicio_id, carga, reps, qualidade: body.qualidade });

  if (error) {
    // A mensagem do Postgres vai pro log, não pra tela: no formato novo o campo
    // `error` é exatamente o texto que o atalho mostra ao usuário.
    return falha(500, "não deu para salvar a série, tente novamente", error.message);
  }

  return sucesso({});
});
