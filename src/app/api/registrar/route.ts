import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_ACESSO, temAcesso, type PerfilAcesso } from "@/lib/acesso";
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
 */
export async function POST(request: NextRequest) {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json({ error: "muitas requisições, tente novamente em instantes" }, { status: 429 });
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
    return NextResponse.json(
      { error: "campos obrigatórios: token, exercicio_id, carga > 0, reps > 0, qualidade (boa | razoavel | ruim)" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(`id, ${COLUNAS_ACESSO}`)
    .eq("api_token", body.token)
    .maybeSingle<PerfilAcesso & { id: string }>();
  if (!profile) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui — senão o atalho continua
  // gravando séries depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(profile)) {
    return NextResponse.json({ error: "assinatura inativa — reative no app" }, { status: 402 });
  }

  const { data: exercicio } = await admin
    .from("exercicios")
    .select("id")
    .eq("id", body.exercicio_id)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!exercicio) {
    return NextResponse.json({ error: "exercício não encontrado" }, { status: 404 });
  }

  const { error } = await admin
    .from("series")
    .insert({ exercicio_id: body.exercicio_id, carga, reps, qualidade: body.qualidade });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
