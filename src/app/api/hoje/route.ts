import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_ACESSO, temAcesso, type PerfilAcesso } from "@/lib/acesso";
import { falha, rotaAtalho, sucesso } from "@/lib/atalho";
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
 *
 * Responde sempre 200, com erro no corpo. Ver `src/lib/atalho.ts`.
 */
export const GET = rotaAtalho(async (request: NextRequest) => {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return falha(429, "muitas requisições, tente novamente em instantes");
  }

  const token = request.nextUrl.searchParams.get("token");
  const admin = createAdminClient();
  const perfil = await resolvePerfil(admin, token);

  if (!perfil) {
    return falha(401, "token inválido");
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui — senão o atalho continua
  // funcionando depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(perfil)) {
    return falha(402, "assinatura inativa, reative no app");
  }

  // Segunda cota, agora pelo token. A de cima é por IP, e um token compartilhado
  // entre pessoas em redes diferentes ganharia uma cota independente para cada
  // uma. Limitando o token, quem compartilha divide a mesma cota.
  const porToken = await checkRateLimit(`token:${perfil.id}`);
  if (!porToken.success) {
    return falha(429, "muitas requisições, tente novamente em instantes");
  }

  const userId = perfil.id;

  const { data: treinos } = await admin.from("treinos").select("*").eq("user_id", userId);
  if (!treinos || treinos.length === 0) {
    return falha(404, "nenhum treino configurado");
  }

  const treinoDeHoje = getTreinoDeHoje(treinos as Treino[]);
  if (!treinoDeHoje) {
    return falha(404, "hoje é dia de descanso");
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

  return sucesso({ treino_nome: treinoDeHoje.nome, exercicios: resultado });
});
