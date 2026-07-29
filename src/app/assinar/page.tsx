import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SairButton } from "@/components/auth/sair-button";
import { createClient } from "@/lib/supabase/server";
import { COLUNAS_ACESSO, trialVigente, type PerfilAcesso } from "@/lib/acesso";
import { PLANO } from "@/lib/pricing";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";

export default async function AssinarPage() {
  // Quem chega aqui com `trial_ends_at` no passado terminou o teste, e merece
  // uma frase diferente de quem nunca teve um. Sem isso a tela dizia "sua conta
  // está criada" para alguém que usou o app por uma semana.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let trialTerminou = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select(COLUNAS_ACESSO)
      .eq("id", user.id)
      .maybeSingle<PerfilAcesso>();
    trialTerminou = Boolean(data?.trial_ends_at) && !trialVigente(data);
  }

  return (
    // min-h-svh: mesma razão de (app)/layout.tsx e do /login. dvh oscila quando
    // a barra do Safari some na rolagem.
    <div className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center bg-background px-6 py-10 text-foreground">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">TapGym</h1>
        {/* Diz explicitamente em que ponto a pessoa está: quem chegava aqui do
            cadastro achava que ainda estava no meio do processo, e leu o botão
            de sair como "voltar", perdendo a sessão que acabou de criar. */}
        <p className="mt-2 text-muted-foreground">
          {trialTerminou
            ? "Seu teste de 7 dias terminou. Assine para continuar de onde parou."
            : "Sua conta está criada. Assine para liberar o app."}
        </p>
      </div>

      <div className="shadow-soft-elevated rounded-2xl bg-card p-6 text-center">
        <p className="text-[13px] text-muted-foreground">Plano {PLANO.nome.toLowerCase()}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{PLANO.preco}</p>
        <p className="text-[13px] text-muted-foreground">{PLANO.periodo}</p>

        <ul className="mt-5 flex flex-col gap-2 text-left text-[14px]">
          {PLANO.beneficios.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <form action="/api/stripe/checkout" method="POST" className="mt-6">
          <Button type="submit" className="h-12 w-full rounded-xl text-[15px] font-bold">
            Assinar
          </Button>
        </form>
      </div>

      {/* Duas saídas, em ordem de custo: voltar pra LP mantém a sessão (o
          middleware libera a "/" pra quem está logado sem assinatura), sair
          encerra. Antes só existia a segunda. */}
      <div className="mt-6 flex flex-col gap-2">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="ghost"
          className="h-12 w-full rounded-xl text-[15px] font-bold"
        >
          Voltar ao site
        </Button>
        <SairButton className="h-12 w-full rounded-xl" />
      </div>

      <LegalFooterLinks className="mt-8" />
    </div>
  );
}
