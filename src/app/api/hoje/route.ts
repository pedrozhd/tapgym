import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_ACESSO, temAcesso, type PerfilAcesso } from "@/lib/acesso";
import { getTreinoDeHoje, getUltimaSerie } from "@/lib/dashboard";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";
import type { Exercicio, Serie, Treino, TreinoExercicio } from "@/lib/types";

type PerfilToken = PerfilAcesso & { id: string };

async function resolvePerfil(
  admin: ReturnType<typeof createAdminClient>,
  token: string | null,
): Promise<PerfilToken | null> {
  if (!token) return null;
  const { data } = await admin
    .from("profiles")
    .select(`id, ${COLUNAS_ACESSO}`)
    .eq("api_token", token)
    .maybeSingle();
  return (data as PerfilToken | null) ?? null;
}

/**
 * GET /api/hoje?token=... — retorna o treino de hoje e seus exercícios para o
 * Shortcut do iOS. `token` é o `profiles.api_token` de cada usuário — resolvido
 * aqui para o user_id porque a rota usa a service role key, que ignora RLS.
 */
export async function GET(request: NextRequest) {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json({ error: "muitas requisições, tente novamente em instantes" }, { status: 429 });
  }

  const token = request.nextUrl.searchParams.get("token");
  const admin = createAdminClient();
  const perfil = await resolvePerfil(admin, token);

  if (!perfil) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui — senão o atalho continua
  // funcionando depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(perfil)) {
    return NextResponse.json({ error: "assinatura inativa — reative no app" }, { status: 402 });
  }

  const userId = perfil.id;

  const { data: treinos } = await admin.from("treinos").select("*").eq("user_id", userId);
  if (!treinos || treinos.length === 0) {
    return NextResponse.json({ error: "nenhum treino configurado" }, { status: 404 });
  }

  const treinoDeHoje = getTreinoDeHoje(treinos as Treino[]);
  if (!treinoDeHoje) {
    return NextResponse.json({ error: "hoje é dia de descanso" }, { status: 404 });
  }

  const { data: treinoExercicios } = await admin
    .from("treino_exercicios")
    .select("*")
    .eq("treino_id", treinoDeHoje.id)
    .order("ordem");

  const exercicioIds = ((treinoExercicios ?? []) as TreinoExercicio[]).map((te) => te.exercicio_id);

  const [{ data: exercicios }, { data: series }] = await Promise.all([
    exercicioIds.length
      ? admin.from("exercicios").select("*").in("id", exercicioIds)
      : Promise.resolve({ data: [] as Exercicio[] }),
    exercicioIds.length
      ? admin.from("series").select("*").in("exercicio_id", exercicioIds)
      : Promise.resolve({ data: [] as Serie[] }),
  ]);

  const resultado = ((treinoExercicios ?? []) as TreinoExercicio[]).map((te) => {
    const exercicio = ((exercicios ?? []) as Exercicio[]).find((e) => e.id === te.exercicio_id);
    const ultima = getUltimaSerie(((series ?? []) as Serie[]).filter((s) => s.exercicio_id === te.exercicio_id));
    return {
      id: te.exercicio_id,
      nome: exercicio?.nome ?? "Exercício",
      num_series: te.num_series,
      rep_min: te.rep_min,
      rep_max: te.rep_max,
      ultima_carga: ultima?.carga ?? 0,
    };
  });

  return NextResponse.json({ treino_nome: treinoDeHoje.nome, exercicios: resultado });
}
