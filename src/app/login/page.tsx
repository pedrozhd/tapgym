"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypographyLead } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar";

function traduzErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha inválidos.";
  if (msg.includes("User already registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);
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
      setErro(traduzErro(error.message));
      return;
    }
    if (data.session) {
      router.replace("/assinar");
      router.refresh();
      return;
    }
    setMensagem("Conta criada! Verifique seu e-mail para confirmar o acesso.");
  }

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col justify-center bg-background px-6 text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">TapGym</h1>
        <TypographyLead className="mt-1">
          {modo === "entrar" ? "Entre para continuar sua progressão." : "Crie sua conta para começar."}
        </TypographyLead>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        {modo === "criar" && (
          <Input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="name"
            className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
          />
        )}
        <Input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
        />
        <Input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          className="shadow-soft-elevated h-12 rounded-xl border-none bg-card px-4 text-base"
        />

        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {mensagem && <p className="text-sm text-success">{mensagem}</p>}

        <Button type="submit" disabled={carregando} className="shadow-soft-elevated h-12 rounded-xl text-[15px] font-bold">
          {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === "entrar" ? "criar" : "entrar"));
          setNome("");
          setErro(null);
          setMensagem(null);
        }}
        className="mt-5 text-center text-sm text-muted-foreground"
      >
        {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
      </button>

      <p className="absolute inset-x-0 bottom-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TapGym. Todos os direitos reservados.
      </p>
    </div>
  );
}
