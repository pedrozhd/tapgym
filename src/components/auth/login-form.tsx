"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { Input } from "@/components/ui/input";
import { TypographyLead } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar";

/** Segundos de espera antes de liberar outro e-mail de confirmação. */
const COOLDOWN_REENVIO = 60;

function traduzErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha inválidos.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  // Só acontece com "Confirm email" ligado no Supabase: a conta existe, mas o
  // link do e-mail ainda não foi aberto. Sem esta linha o usuário lia o texto
  // cru em inglês, que não diz o que fazer.
  if (msg.includes("Email not confirmed")) {
    return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  }
  // Rate limit do próprio Supabase, tanto no signup quanto no reenvio.
  if (msg.includes("For security purposes") || msg.includes("rate limit")) {
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  }
  // Provider de e-mail desligado no Supabase (`Enable email provider`), ou
  // cadastro por e-mail bloqueado. Estado alcançável por configuração errada —
  // já aconteceu — e o texto cru vazava em inglês na tela.
  if (msg.includes("logins are disabled") || msg.includes("Signups not allowed") || msg.includes("signups are disabled")) {
    return "O acesso por e-mail e senha está desativado. Use “Continuar com Google”.";
  }
  // Falha no envio do e-mail de confirmação (SMTP fora do ar, domínio não
  // verificado, remetente recusado): o GoTrue responde com corpo vazio e o
  // supabase-js repassa isso como `message`, então "{}" chegava na tela.
  if (msg.includes("Error sending") || msg.includes("unexpected_failure")) {
    return "Não deu pra enviar o e-mail de confirmação. Use “Continuar com Google”, ou tente de novo em alguns minutos.";
  }
  // Rede de segurança: qualquer mensagem que não seja texto legível (JSON,
  // vazia) vira uma frase util em vez de ser despejada crua.
  const limpo = msg.trim();
  if (limpo === "" || limpo.startsWith("{") || limpo.startsWith("[")) {
    return "Não deu pra criar a conta agora. Use “Continuar com Google”, ou tente de novo em alguns minutos.";
  }
  return msg;
}

export function LoginForm({ modoInicial }: { modoInicial: Modo }) {
  const router = useRouter();
  const nomeId = useId();
  const emailId = useId();
  const senhaId = useId();

  const [modo, setModo] = useState<Modo>(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // E-mail que está aguardando confirmação. Quando preenchido, troca o
  // formulário por um estado próprio — antes a mensagem aparecia embaixo do
  // form, que continuava ali, sem indicar o que fazer nem como reenviar.
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const supabase = createClient();

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setCarregando(false);
      if (error) {
        setErro(traduzErro(error.message));
        return;
      }
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome: nome.trim() } },
    });
    setCarregando(false);
    if (error) {
      // `status`/`code` não aparecem na tela mas são o que identifica a causa
      // (ex.: 500 + unexpected_failure = falha de SMTP no envio) quando a
      // `message` vem vazia. Sem isto, o diagnóstico depende do log do Supabase.
      console.error("signUp falhou", { status: error.status, code: error.code, message: error.message });
      setErro(traduzErro(error.message));
      return;
    }
    // Sessão na resposta = "Confirm email" desligado: já está logado. Vai pro
    // app, não pro paywall: contas novas ganham 7 dias de teste (migração 0012),
    // então a cobrança aparece depois, quando a pessoa já viu o produto rodando
    // com os dados dela.
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setAguardandoConfirmacao(email);
    setCooldown(COOLDOWN_REENVIO);
  }

  async function onReenviar() {
    if (!aguardandoConfirmacao || cooldown > 0) return;
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: aguardandoConfirmacao });
    if (error) {
      setErro(traduzErro(error.message));
      return;
    }
    setReenviado(true);
    setCooldown(COOLDOWN_REENVIO);
  }

  function trocarModo(novo: Modo) {
    setModo(novo);
    setNome("");
    setErro(null);
  }

  if (aguardandoConfirmacao) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Confirme seu e-mail</h1>
          {/* Copy neutra de propósito: com "Confirm email" ligado, o Supabase
              responde igual para e-mail novo e para e-mail já cadastrado (é
              anti-enumeração). Afirmar "conta criada" seria mentira no segundo
              caso. */}
          <TypographyLead className="mt-1">
            Enviamos um link para <span className="font-bold text-foreground">{aguardandoConfirmacao}</span>. Abra o
            link para ativar sua conta e voltar pro TapGym.
          </TypographyLead>
        </div>

        <div aria-live="polite" className="min-h-5">
          {reenviado && <p className="text-sm text-success">E-mail reenviado.</p>}
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onReenviar}
            disabled={cooldown > 0}
            className="h-12 rounded-xl text-[15px] font-bold"
          >
            {cooldown > 0 ? `Reenviar e-mail em ${cooldown}s` : "Reenviar e-mail"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAguardandoConfirmacao(null);
              setReenviado(false);
              trocarModo("entrar");
            }}
            className="h-12 rounded-xl text-[15px] font-bold"
          >
            Já confirmei, quero entrar
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-8">
        {/* O título é a saída da tela: sem ele, quem abriu o login sem querer só
            volta pelo botão do navegador. */}
        <Link href="/" className="inline-block active:opacity-70">
          <h1 className="text-3xl font-extrabold tracking-tight">TapGym</h1>
        </Link>
        <TypographyLead className="mt-1">
          {modo === "entrar" ? "Entre para continuar sua progressão." : "Crie sua conta para começar."}
        </TypographyLead>
      </div>

      {/* Google acima do formulário: é o caminho de menor atrito (nenhuma senha
          pra inventar) e um provider só cobre entrar e cadastrar. */}
      <GoogleButton onErro={setErro} />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold text-muted-foreground">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {modo === "criar" && (
          <>
            <label htmlFor={nomeId} className="sr-only">
              Seu nome
            </label>
            <Input
              id={nomeId}
              type="text"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
              className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
            />
          </>
        )}
        <label htmlFor={emailId} className="sr-only">
          E-mail
        </label>
        <Input
          id={emailId}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
        />
        <label htmlFor={senhaId} className="sr-only">
          Senha
        </label>
        <Input
          id={senhaId}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
        />

        <div aria-live="polite" className="empty:hidden">
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <Button
          type="submit"
          disabled={carregando}
          className="shadow-soft-elevated h-12 rounded-xl text-[15px] font-bold"
        >
          {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      {/* Antes era um <button> de texto cinza, sem borda nem feedback de toque,
          com ~20px de altura — parecia legenda, não ação. É o único caminho
          pra criar conta, então virou botão de verdade. */}
      <div className="mt-6 flex flex-col gap-2.5 border-t border-border pt-6">
        <p className="text-center text-sm text-muted-foreground">
          {modo === "entrar" ? "Não tem conta?" : "Já tem conta?"}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => trocarModo(modo === "entrar" ? "criar" : "entrar")}
          className="h-12 rounded-xl text-[15px] font-bold"
        >
          {modo === "entrar" ? "Criar conta" : "Entrar"}
        </Button>
      </div>
    </>
  );
}
