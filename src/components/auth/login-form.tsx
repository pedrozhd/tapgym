"use client";

import { useState } from "react";
import Link from "next/link";
import { GoogleButton } from "@/components/auth/google-button";
import { TypographyLead } from "@/components/ui/typography";

/**
 * Login só via Google. Um provider cobre entrar e cadastrar: e-mail novo cria
 * a conta; e-mail já cadastrado (e confirmado) vincula à conta existente.
 *
 * O formulário de e-mail/senha foi removido de propósito — menos atrito no
 * trial e menos superfície (confirmação, Turnstile, recuperação de senha).
 */
export function LoginForm() {
  const [erro, setErro] = useState<string | null>(null);

  return (
    <>
      <div className="mb-8">
        {/* O título é a saída da tela: sem ele, quem abriu o login sem querer só
            volta pelo botão do navegador. */}
        <Link href="/" className="inline-block active:opacity-70">
          <h1 className="text-3xl font-extrabold tracking-tight">TapGym</h1>
        </Link>
        <TypographyLead className="mt-1">Entre ou crie sua conta com o Google.</TypographyLead>
      </div>

      <GoogleButton onErro={setErro} />

      <div aria-live="polite" className="mt-4 empty:hidden">
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>

      <p className="mt-6 text-center text-[13px] leading-relaxed text-muted-foreground">
        Ao continuar, você concorda com os{" "}
        <Link href="/termos" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Termos
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Privacidade
        </Link>
        .
      </p>
    </>
  );
}
