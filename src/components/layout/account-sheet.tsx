"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BlurCommitInput } from "@/components/ui/blur-commit-input";
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

export function AccountSheet({ open, onOpenChange, email, nome, onUpdateNome }: AccountSheetProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
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
      .select("api_token")
      .single()
      .then(({ data }) => setToken(data?.api_token ?? null));
  }, [open]);

  async function onCopiar() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
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
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
              {token ?? "Carregando..."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopiar}
              disabled={!token}
              className="h-8 shrink-0 rounded-lg"
            >
              {copiado ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>

        <SheetFooter>
          <form action="/api/stripe/portal" method="POST">
            <Button type="submit" variant="outline" className="h-11 w-full rounded-xl">
              Gerenciar assinatura
            </Button>
          </form>
          <Button variant="outline" onClick={onSignOut} className="h-11 rounded-xl">
            Sair
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
