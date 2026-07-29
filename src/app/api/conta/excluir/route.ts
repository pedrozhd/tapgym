import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { checkRateLimit, clientIp } from "@/lib/ratelimit";

/**
 * POST /api/conta/excluir — apaga a conta do usuário logado.
 *
 * Ordem: cancela assinatura Stripe (se houver) → limpa tabelas de treino →
 * remove profile → deleteUser no Auth. A limpeza explícita evita lixo se o
 * cascade no banco não estiver completo (migrações não vivem neste repo).
 */
export async function POST(request: NextRequest) {
  const { success } = await checkRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json(
      { error: "Muitas requisições, tente novamente em instantes" },
      { status: 429 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const userId = user.id;

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      // Sub já cancelada/inexistente não bloqueia a exclusão da conta.
      console.error("Falha ao cancelar assinatura Stripe na exclusão de conta:", err);
    }
  }

  const { data: exercicios, error: erroExercicios } = await admin
    .from("exercicios")
    .select("id")
    .eq("user_id", userId);

  if (erroExercicios) {
    return NextResponse.json({ error: "Não deu pra apagar os exercícios." }, { status: 500 });
  }

  const exercicioIds = (exercicios ?? []).map((e) => e.id as string);

  if (exercicioIds.length > 0) {
    const { error: erroSeries } = await admin.from("series").delete().in("exercicio_id", exercicioIds);
    if (erroSeries) {
      return NextResponse.json({ error: "Não deu pra apagar as séries." }, { status: 500 });
    }
    const { error: erroTe } = await admin
      .from("treino_exercicios")
      .delete()
      .in("exercicio_id", exercicioIds);
    if (erroTe) {
      return NextResponse.json({ error: "Não deu pra apagar os vínculos de treino." }, { status: 500 });
    }
  }

  const { data: treinos } = await admin.from("treinos").select("id").eq("user_id", userId);
  const treinoIds = (treinos ?? []).map((t) => t.id as string);
  if (treinoIds.length > 0) {
    const { error: erroTeTreino } = await admin
      .from("treino_exercicios")
      .delete()
      .in("treino_id", treinoIds);
    if (erroTeTreino) {
      return NextResponse.json({ error: "Não deu pra apagar os vínculos de treino." }, { status: 500 });
    }
  }

  const { error: erroTreinos } = await admin.from("treinos").delete().eq("user_id", userId);
  if (erroTreinos) {
    return NextResponse.json({ error: "Não deu pra apagar os treinos." }, { status: 500 });
  }

  const { error: erroExDelete } = await admin.from("exercicios").delete().eq("user_id", userId);
  if (erroExDelete) {
    return NextResponse.json({ error: "Não deu pra apagar os exercícios." }, { status: 500 });
  }

  const { error: erroProfile } = await admin.from("profiles").delete().eq("id", userId);
  if (erroProfile) {
    return NextResponse.json({ error: "Não deu pra apagar o perfil." }, { status: 500 });
  }

  const { error: erroAuth } = await admin.auth.admin.deleteUser(userId);
  if (erroAuth) {
    return NextResponse.json({ error: "Não deu pra apagar a conta de acesso." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
