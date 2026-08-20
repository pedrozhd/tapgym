import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_ACESSO, temAcesso, type PerfilAcesso } from "@/lib/acesso";
import { extrairToken, falha, rotaAtalho, sucesso } from "@/lib/atalho";
import { getTreinoDeHoje } from "@/lib/dashboard";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";
import { getDataLocalISO } from "@/lib/timezone";
import type { Exercicio, ExercicioVariacao, ExercicioVariacaoDia, Serie, Treino, TreinoExercicio } from "@/lib/types";
import { nomeAtalho, ultimaSerieDaClassificacao, variacaoIdDoDia, nomeVariacao } from "@/lib/variacao-exercicio";

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
 * GET /api/hoje: retorna o treino de hoje e seus exercícios para o Shortcut
 * do iOS. `token` é o `profiles.api_token` de cada usuário, aceito por header
 * `Authorization: Bearer` (preferido) ou por `?token=` (fallback, ver
 * `extrairToken` em `src/lib/atalho.ts`), resolvido aqui para o user_id
 * porque a rota usa a service role key, que ignora RLS.
 *
 * Responde sempre 200, com erro no corpo. Ver `src/lib/atalho.ts`.
 */
export const GET = rotaAtalho(async (request: NextRequest) => {
  const { success } = await checkRateLimit(`hoje:${clientIp(request)}`);
  if (!success) {
    return falha(429, "Muitas requisições, tente novamente em instantes");
  }

  const token = extrairToken(request);
  const admin = createAdminClient();
  const perfil = await resolvePerfil(admin, token);

  if (!perfil) {
    return falha(401, "Token inválido");
  }

  // Esta rota não passa pelo middleware (nem por RLS, por usar a service role
  // key), então o paywall precisa ser checado aqui, senão o atalho continua
  // funcionando depois de a assinatura ser cancelada ou ficar em atraso.
  if (!temAcesso(perfil)) {
    return falha(402, "Assinatura inativa, reative no app");
  }

  // Segunda cota, agora pelo token. A de cima é por IP, e um token compartilhado
  // entre pessoas em redes diferentes ganharia uma cota independente para cada
  // uma. Limitando o token, quem compartilha divide a mesma cota.
  const porToken = await checkRateLimit(`token:${perfil.id}`);
  if (!porToken.success) {
    return falha(429, "Muitas requisições, tente novamente em instantes");
  }

  const userId = perfil.id;

  const { data: treinos } = await admin.from("treinos").select("*").eq("user_id", userId);
  if (!treinos || treinos.length === 0) {
    return falha(404, "Nenhum treino configurado");
  }

  const treinoDeHoje = getTreinoDeHoje(treinos as Treino[]);
  if (!treinoDeHoje) {
    return falha(404, "Hoje é dia de descanso");
  }

  const { data: treinoExercicios } = await admin
    .from("treino_exercicios")
    .select("*")
    .eq("treino_id", treinoDeHoje.id)
    .order("ordem");

  const exercicioIds = ((treinoExercicios ?? []) as TreinoExercicio[]).map((te) => te.exercicio_id);

  // .eq("user_id", userId) é o que impede um exercicio_id de outro usuário
  // (colado em treino_exercicios por fora da UI, já que a policy de RLS dessa
  // tabela só valida o treino) de vazar nome e carga aqui: como a rota usa a
  // service role key, é este filtro, não o banco, quem garante a posse.
  const { data: exercicios } = exercicioIds.length
    ? await admin.from("exercicios").select("*").in("id", exercicioIds).eq("user_id", userId)
    : { data: [] as Exercicio[] };

  const exercicioIdsDoDono = ((exercicios ?? []) as Exercicio[]).map((e) => e.id);

  const { data: series } = exercicioIdsDoDono.length
    ? await admin.from("series").select("*").in("exercicio_id", exercicioIdsDoDono)
    : { data: [] as Serie[] };

  const variacoesRes = exercicioIdsDoDono.length
    ? await admin.from("exercicio_variacoes").select("*").in("exercicio_id", exercicioIdsDoDono)
    : { data: [] as ExercicioVariacao[], error: null };

  const variacoesDiaRes = exercicioIdsDoDono.length
    ? await admin.from("exercicio_variacao_dia").select("*").in("exercicio_id", exercicioIdsDoDono)
    : { data: [] as ExercicioVariacaoDia[], error: null };

  if (variacoesRes.error) {
    console.error("[atalho/hoje] exercicio_variacoes", variacoesRes.error);
  }
  if (variacoesDiaRes.error) {
    console.error("[atalho/hoje] exercicio_variacao_dia", variacoesDiaRes.error);
  }

  const variacoes = variacoesRes.data;
  const variacoesDia = variacoesDiaRes.data;

  const hojeStr = getDataLocalISO(new Date());

  const resultado = ((treinoExercicios ?? []) as TreinoExercicio[])
    .filter((te) => exercicioIdsDoDono.includes(te.exercicio_id))
    .map((te) => {
      const exercicio = ((exercicios ?? []) as Exercicio[]).find((e) => e.id === te.exercicio_id);
      const varId = variacaoIdDoDia((variacoesDia ?? []) as ExercicioVariacaoDia[], te.exercicio_id, hojeStr);
      const varNome = nomeVariacao((variacoes ?? []) as ExercicioVariacao[], varId);
      const ultima = ultimaSerieDaClassificacao(
        (series ?? []) as Serie[],
        (variacoesDia ?? []) as ExercicioVariacaoDia[],
        te.exercicio_id,
        varId,
      );
      return {
        id: te.exercicio_id,
        nome: nomeAtalho(exercicio?.nome ?? "", varNome),
        num_series: te.num_series,
        rep_min: te.rep_min,
        rep_max: te.rep_max,
        ultima_carga: ultima?.carga ?? 0,
        variacao: varNome,
      };
    });

  return sucesso({ treino_nome: treinoDeHoje.nome, exercicios: resultado });
});
