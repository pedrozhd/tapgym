"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

// Link do iCloud é imutável por versão: editar o atalho gera um link novo e o
// antigo continua servindo a versão velha pra sempre. Ao editar, troque aqui.
export const SHORTCUT_URL = "https://www.icloud.com/shortcuts/f5905800eff74bc2876ef905b734c272";

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
      <DialogContent className="max-w-[340px] rounded-2xl bg-card">
        <DialogHeader>
          <DialogTitle>Atalho do TapGym</DialogTitle>
        </DialogHeader>

        <p className="rounded-xl bg-background px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
          Registre a série pela tela de início do iPhone, sem abrir o app. São dois minutos de configuração,
          uma única vez.
        </p>

        <ol className="flex flex-col gap-3 text-[13px] leading-relaxed">
          <li className="flex flex-col gap-2">
            <span>
              <strong className="text-foreground">1.</strong> Copie seu token de acesso.
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
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

        <Button
          render={<a href={SHORTCUT_URL} target="_blank" rel="noreferrer" />}
          nativeButton={false}
          className="shadow-soft-elevated mt-1 h-11 w-full rounded-xl"
        >
          Instalar atalho
        </Button>
      </DialogContent>
    </Dialog>
  );
}
