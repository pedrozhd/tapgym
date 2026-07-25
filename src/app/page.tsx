import Link from "next/link";
import { Calendar, Hand, Lock, Target, TrendingUp, Zap } from "lucide-react";
import LandingHero from "@/components/marketing/landing-hero";
import { SairButton } from "@/components/auth/sair-button";
import { createClient } from "@/lib/supabase/server";
import { PLANO } from "@/lib/pricing";

const PASSOS = [
  { numero: "1", titulo: "Monte seu treino", descricao: "Estruture seus dias e exercícios do seu jeito, sem modelos fixos." },
  { numero: "2", titulo: "Registre a série", descricao: "Carga, reps e qualidade em três toques, entre uma série e outra." },
  { numero: "3", titulo: "Veja a evolução", descricao: "Gráfico de carga por exercício e volume semanal, sem esforço." },
];

const BENEFICIOS = [
  { icon: TrendingUp, titulo: "Progressão real", descricao: "Todo exercício com seu próprio histórico de carga, sem se perder em planilhas." },
  { icon: Hand, titulo: "Toques grandes", descricao: "Interface pensada pra registrar suado, entre séries, sem precisão de laboratório." },
  { icon: Calendar, titulo: "Seu treino, sua ordem", descricao: "Monte a divisão que quiser, sem forçar PPL, Upper/Lower ou qualquer modelo." },
  { icon: Target, titulo: "Qualidade da série", descricao: "Marque se a série foi boa, razoável ou ruim: contexto que a carga sozinha não dá." },
  { icon: Zap, titulo: "Rápido de verdade", descricao: "Registrar uma série leva menos tempo do que descansar entre elas." },
  { icon: Lock, titulo: "Seus dados", descricao: "Seu histórico fica com você, sem redes sociais, sem feed, sem distração." },
];

const LINK_HEADER =
  "flex h-10 items-center rounded-full border border-border px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary";

/**
 * A LP é dinâmica (não mais estática) porque precisa saber se há sessão: o
 * middleware libera esta página pra quem está logado sem assinatura — é a saída
 * do paywall que não custa a sessão — e pra esse visitante "Entrar" e "Criar
 * conta" são convites errados. Ele já entrou e já criou.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const logado = user !== null;

  // Quem está logado e chega aqui não tem assinatura (o middleware desvia os
  // assinantes pro /dashboard), então o destino de compra é o paywall direto,
  // sem passar pelo /login.
  const hrefAssinar = logado ? "/assinar" : "/login?modo=criar";

  return (
    <div className="bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-8">
        <span className="text-lg font-bold tracking-tight">TapGym</span>
        <div className="flex items-center gap-2">
          {logado ? (
            <>
              <Link href="/assinar" className={LINK_HEADER}>
                Assinar
              </Link>
              {/* Sair tem que existir aqui: sem assinatura o usuário só alcança
                  esta página e o /assinar, então este e o do paywall são os
                  únicos pontos de saída do app. */}
              <SairButton redirectTo="/" className="h-10 rounded-full px-4 text-[13px] font-semibold" />
            </>
          ) : (
            <Link href="/login" className={LINK_HEADER}>
              Entrar
            </Link>
          )}
        </div>
      </header>

      <h1 className="sr-only">TapGym — Progressão de carga, sem planilha.</h1>

      {/* Experiência 3D (ou fallback estático em reduced-motion) */}
      <LandingHero />

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">Como funciona</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Três passos. Toda vez.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {PASSOS.map((passo) => (
              <div key={passo.numero} className="bg-card p-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-[13px] font-bold text-primary">
                  {passo.numero}
                </span>
                <h3 className="mt-5 text-[17px] font-bold tracking-tight">{passo.titulo}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{passo.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">Por que o TapGym</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Feito pra usar dentro da academia.</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 md:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-primary">
                  <b.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold tracking-tight">{b.titulo}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{b.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">Preço</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Um plano. Sem pegadinha.</h2>
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-card p-8 text-left">
            <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">{PLANO.nome}</p>
            <p className="mt-2 text-5xl font-bold tracking-tight">{PLANO.preco}</p>
            <p className="mt-1 text-[14px] text-muted-foreground">{PLANO.periodo}</p>
            <ul className="mt-6 flex flex-col gap-2.5 text-[14px]">
              {PLANO.beneficios.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            {/* Visitante anônimo em /assinar é redirecionado pro /login pelo
                middleware — apontar direto pro /login evita o hop. `modo=criar`
                abre já no cadastro: quem vem daqui não tem conta ainda. Depois
                do signup, o próprio login manda pra /assinar. */}
            <Link
              href={hrefAssinar}
              className="mt-8 flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Assinar
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <h2 className="mx-auto max-w-[26ch] text-3xl font-bold tracking-tight sm:text-4xl">
            Sua próxima carga máxima começa aqui.
          </h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-[15px] text-muted-foreground">
            {logado
              ? "Libere o app e registre sua primeira série hoje."
              : "Crie sua conta e registre sua primeira série hoje."}
          </p>
          {/* "Criar conta" só pra quem não tem: quem já criou vê a ação que
              falta de verdade, que é assinar. */}
          <Link
            href={hrefAssinar}
            className="mx-auto mt-8 flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-primary px-6 text-[15px] font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            {logado ? "Assinar" : "Criar conta"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-10 text-center text-[13px] text-muted-foreground">
          <span className="font-bold text-foreground">TapGym</span>
          <span>© 2026 TapGym. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}
