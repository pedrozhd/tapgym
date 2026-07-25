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
}

export function AccountSheet({ open, onOpenChange, email, nome, onUpdateNome }: AccountSheetProps) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);
  const [erroNome, setErroNome] = useState<string | null>(null);

  async function onCommitNome(novoNome: string) {
    setErroNome(null);
    try {
      await onUpdateNome(novoNome);
    } catch {
      setErroNome("Não deu pra salvar o nome — tenta de novo.");
    }
  }

  useEffect(() => {
    if (!open) return;
    createClient()
      .from("profiles")
      .select("api_token, stripe_customer_id, is_legacy_free")
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto w-full max-w-[430px] rounded-t-2xl border-border bg-card">
        <SheetHeader>
          <SheetTitle>Conta</SheetTitle>
          <SheetDescription>{email ?? "—"}</SheetDescription>
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
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
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
              Não deu pra copiar — toque no token e copie manualmente.
            </p>
          )}
        </div>

        <SheetFooter>
          {/* Só quem passou pelo Stripe tem portal pra abrir. Antes o botão
              aparecia pra todos: sem `stripe_customer_id` a rota redireciona
              pra /assinar, o middleware devolve pro /dashboard e o toque não
              produzia nada visível. */}
          {perfil?.stripe_customer_id ? (
            <form action="/api/stripe/portal" method="POST">
              <Button type="submit" variant="outline" className="h-11 w-full rounded-xl">
                Gerenciar assinatura
              </Button>
            </form>
          ) : perfil?.is_legacy_free ? (
            <p className="px-1 text-center text-xs text-muted-foreground">
              Seu acesso é gratuito e vitalício — não há assinatura pra gerenciar.
            </p>
          ) : null}
          <SairButton className="h-11 w-full rounded-xl" />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
