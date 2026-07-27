"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
import { SairButton } from "@/components/auth/sair-button";
import { TypographyEyebrow } from "@/components/ui/typography";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { diasRestantesTrial } from "@/lib/acesso";

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | null;
  nome: string | null;
  onUpdateNome: (nome: string) => Promise<void>;
}

interface Perfil {
  api_token: string | null;
  stripe_customer_id: string | null;
  is_legacy_free: boolean;
  trial_ends_at: string | null;
}

export function AccountSheet({ open, onOpenChange, email, nome, onUpdateNome }: AccountSheetProps) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [confirmandoRotacao, setConfirmandoRotacao] = useState(false);
  const [rotacionando, setRotacionando] = useState(false);
  const [erroRotacao, setErroRotacao] = useState<string | null>(null);

  async function onCommitNome(novoNome: string) {
    setErroNome(null);
    try {
      await onUpdateNome(novoNome);
    } catch {
      setErroNome("Não deu pra salvar o nome. Tenta de novo.");
    }
  }

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("profiles")
      .select("api_token, stripe_customer_id, is_legacy_free, trial_ends_at")
      .single()
      .then(({ data }) => setPerfil(data ?? null));
  }, [open]);

  const token = perfil?.api_token ?? null;

  async function onCopiar() {
    if (!token) return;
    setErroCopia(false);
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      // Safari nega a área de transferência fora de contexto seguro / sem
      // gesto direto — sem este catch a promise rejeitava sem ninguém saber.
      setErroCopia(true);
      return;
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  async function onRotacionar() {
    setErroRotacao(null);
    setRotacionando(true);
    try {
      const resposta = await fetch("/api/token/rotate", { method: "POST" });
      if (!resposta.ok) throw new Error("falhou");
      const { api_token } = (await resposta.json()) as { api_token: string };
      setPerfil((p) => (p ? { ...p, api_token } : p));
      setConfirmandoRotacao(false);
    } catch {
      setErroRotacao("Não deu pra gerar um novo token. Tenta de novo.");
    } finally {
      setRotacionando(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-[430px] rounded-t-2xl border-border bg-card">
        <SheetHeader>
          <SheetTitle>Conta</SheetTitle>
          <SheetDescription>{email ?? "Sem e-mail"}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4">
          <TypographyEyebrow>SEU NOME</TypographyEyebrow>
          <BlurCommitInput
            value={nome ?? ""}
            onCommit={onCommitNome}
            placeholder="Como quer ser chamado?"
            className="h-11 rounded-xl border-border bg-background px-3 text-sm"
          />
          {erroNome && <p className="text-xs text-destructive">{erroNome}</p>}
        </div>

        <div className="flex flex-col gap-2 px-4">
          <TypographyEyebrow>TOKEN DO SHORTCUT</TypographyEyebrow>
          {/* min-w-0 nos dois níveis, mesma razão do shortcut-dialog: sem isso a
              largura mínima do token vence o `truncate` e estica o container. */}
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
              {token ?? "Carregando..."}
            </span>
            <Button
              variant="outline"
              onClick={onCopiar}
              disabled={!token}
              className="h-11 shrink-0 rounded-lg px-3"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
          </div>
          {erroCopia && (
            <p className="text-xs text-destructive">
              Não deu pra copiar. Toque no token e copie manualmente.
            </p>
          )}
          {erroRotacao && <p className="text-xs text-destructive">{erroRotacao}</p>}

          {/* Revogação. O token vale acesso pago, e antes disto um token
              compartilhado ou vazado era permanente: a coluna tem default no
              banco e a tela só mostrava e copiava. */}
          {confirmandoRotacao ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                O token atual para de funcionar na hora. Você vai precisar colar o novo no atalho do iPhone,
                senão ele deixa de registrar.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmandoRotacao(false)}
                  disabled={rotacionando}
                  className="h-11 flex-1 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={onRotacionar}
                  disabled={rotacionando}
                  className="h-11 flex-1 rounded-lg font-bold"
                >
                  {rotacionando ? "Gerando..." : "Gerar"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setConfirmandoRotacao(true)}
              disabled={!token}
              className="h-11 w-full rounded-lg text-[13px]"
            >
              Gerar novo token
            </Button>
          )}
        </div>

        <SheetFooter>
          {/* Só quem passou pelo Stripe tem portal pra abrir. Antes o botão
              aparecia pra todos: sem `stripe_customer_id` a rota redireciona
              pra /assinar, o middleware devolve pro /dashboard e o toque não
              produzia nada visível. */}
          {/* O teste vence em silêncio se ninguém avisar: no oitavo dia o app
              tranca sem nenhum aviso prévio. Este contador é o mínimo. */}
          {diasRestantesTrial(perfil) > 0 && (
            <p className="px-1 text-center text-xs text-muted-foreground">
              {diasRestantesTrial(perfil) === 1
                ? "Último dia do seu teste gratuito."
                : `Teste gratuito: ${diasRestantesTrial(perfil)} dias restantes.`}
            </p>
          )}

          {perfil?.stripe_customer_id ? (
            <form action="/api/stripe/portal" method="POST">
              <Button type="submit" variant="outline" className="h-11 w-full rounded-xl">
                Gerenciar assinatura
              </Button>
            </form>
          ) : perfil?.is_legacy_free ? (
            <p className="px-1 text-center text-xs text-muted-foreground">
              Seu acesso é gratuito e vitalício. Não há assinatura pra gerenciar.
            </p>
          ) : perfil ? (
            // Sem customer no Stripe e sem isenção: está em teste gratuito. Este
            // ramo devolvia null, e era o único lugar de cobrança do app inteiro,
            // então quem estava em teste e queria pagar não tinha por onde. A LP
            // também não servia: durante o teste o middleware manda quem está
            // logado de volta pro /dashboard.
            <form action="/api/stripe/checkout" method="POST">
              <Button type="submit" className="h-11 w-full rounded-xl font-bold">
                Assinar agora
              </Button>
            </form>
          ) : null}
          <SairButton className="h-11 w-full rounded-xl" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
