"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Botão de sair compartilhado pela AccountSheet e pelo paywall (`/assinar`).
 *
 * No paywall ele não é opcional: o middleware redireciona toda rota do app
 * pra `/assinar` enquanto não há assinatura, e `/login` devolve quem está
 * logado pra `/dashboard` — que devolve pro paywall. Sem esta saída, quem não
 * quer pagar fica preso e não consegue nem trocar de conta.
 */
export function SairButton({
  className,
  /** Pra onde ir depois de sair. Na LP é a própria "/" — deslogar ali não deve
   *  arrastar o visitante pra uma tela de login que ele não pediu. */
  redirectTo = "/login",
}: {
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function onSignOut() {
    setSaindo(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" onClick={onSignOut} disabled={saindo} className={className}>
      {/* "Sair da conta", não "Sair": no paywall o usuário lia "Sair" como
          "sair desta tela" e perdia a sessão sem querer. */}
      {saindo ? "Saindo..." : "Sair da conta"}
    </Button>
  );
}
