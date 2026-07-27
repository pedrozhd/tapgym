"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

// Link do iCloud é imutável por versão: editar o atalho gera um link novo e o
// antigo continua servindo a versão velha pra sempre. Ao editar o atalho, troque
// a variável (local e na Vercel) e faça deploy, senão todo mundo segue
// instalando a versão antiga.
//
// Mora em env var pra não ficar no repositório. Precisa do prefixo NEXT_PUBLIC
// porque este é um client component; não é segredo, e não tem como ser: o botão
// abaixo existe justamente pra entregar esse link ao usuário.
export const SHORTCUT_URL = process.env.NEXT_PUBLIC_SHORTCUT_URL ?? "";

/**
 * Instruções de instalação do atalho.
 *
 * O token é buscado e copiado aqui dentro de propósito. Antes o passo 2 mandava
 * a pessoa fechar este diálogo, abrir a AccountSheet pelo avatar, copiar e
 * voltar: ela precisava de um valor guardado em outra tela, no meio de um
 * procedimento que já troca de app. A ordem também mudou pra ter uma única
 * troca de app em vez de três (copiar aqui, depois sair pro Atalhos e ficar lá).
 */
export function ShortcutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);

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
    setErroCopia(false);
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      setErroCopia(true);
      return;
    }
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* min() em vez de 340px puro: passar só `max-w-[340px]` fazia o
          tailwind-merge descartar o `max-w-[calc(100%-2rem)]` do DialogContent,
          que é a trava de viewport. */}
      <DialogContent className="max-w-[min(340px,calc(100%-2rem))] rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Atalho do TapGym</DialogTitle>
        </DialogHeader>

        <p className="rounded-xl bg-background px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Registre a série pela tela de início do iPhone, sem abrir o app. São dois minutos de configuração,
          uma única vez.
        </p>

        <ol className="flex min-w-0 flex-col gap-3 text-[13px] leading-relaxed">
          <li className="flex min-w-0 flex-col gap-2">
            <span>
              <strong className="text-foreground">1.</strong> Copie seu token de acesso.
            </span>
            {/* min-w-0 nos dois níveis: item de flex tem `min-width: auto`, então
                a largura mínima do token (48 caracteres sem espaço, em
                monoespaçada) vencia o `truncate` e esticava o diálogo além da
                tela, cortando o botão Copiar e o texto à direita. */}
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                {token ?? "Carregando..."}
              </span>
              <Button
                variant="outline"
                onClick={onCopiar}
                disabled={!token}
                className="h-10 shrink-0 rounded-lg px-3 text-xs"
              >
                {copiado ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            {erroCopia && (
              <span className="text-xs text-destructive">
                Não deu pra copiar. Toque no token e copie manualmente.
              </span>
            )}
          </li>
          <li>
            <strong className="text-foreground">2.</strong> Toque em &ldquo;Instalar atalho&rdquo; abaixo. Isso abre
            o app Atalhos.
          </li>
          <li>
            <strong className="text-foreground">3.</strong> Cole o token onde o atalho pedir.
          </li>
          <li>
            <strong className="text-foreground">4.</strong> No app Atalhos, toque em compartilhar e escolha
            &ldquo;Adicionar à Tela de Início&rdquo;.
          </li>
        </ol>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Precisa ter pelo menos um treino cadastrado em &ldquo;Meu Treino&rdquo;, com a semana definida. Sem isso
          o atalho não encontra o treino de hoje.
        </p>

        {/* Sem a env var, um href="" recarregaria o app e a pessoa não teria
            como entender o que falhou. Botão morto é feio, mas é honesto. */}
        {SHORTCUT_URL ? (
          <Button
            render={<a href={SHORTCUT_URL} target="_blank" rel="noreferrer" />}
            nativeButton={false}
            className="shadow-soft-elevated mt-1 h-11 w-full rounded-xl"
          >
            Instalar atalho
          </Button>
        ) : (
          <Button disabled className="shadow-soft-elevated mt-1 h-11 w-full rounded-xl">
            Atalho indisponível
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
