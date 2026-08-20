"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizarNomeVariacao } from "@/lib/variacao-exercicio";
import type { ExercicioVariacao } from "@/lib/types";

interface VariacaoDoDiaControlProps {
  variacoes: ExercicioVariacao[];
  selecionadaId: string | null;
  rotuloPrefixo?: string;
  onSelect: (variacaoId: string | null) => void | Promise<void>;
  onCreate: (nome: string) => Promise<void>;
}

/**
 * Troca da variação do dia. `<select>` nativo por cima do rótulo, o mesmo
 * padrão do grupamento: no iPhone abre o seletor do iOS, e funciona dentro
 * do diálogo de editar série (um Dialog aninhado no iOS não recebe toque).
 *
 * O valor local é otimista: `selecionadaId` só atualiza depois do upsert e
 * do refresh da store. Sem isto o select volta pra "Padrão" no meio do toque
 * e o atalho continua vendo o nome do pai.
 */
export function VariacaoDoDiaControl({
  variacoes,
  selecionadaId,
  rotuloPrefixo = "Hoje",
  onSelect,
  onCreate,
}: VariacaoDoDiaControlProps) {
  const [localId, setLocalId] = useState(selecionadaId);
  const [pendente, setPendente] = useState(false);
  const [criandoAberto, setCriandoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!pendente && localId !== selecionadaId) {
    setLocalId(selecionadaId);
  }

  const selecionada = variacoes.find((v) => v.id === localId);
  const rotulo = selecionada ? selecionada.nome : "Padrão";
  const limpo = normalizarNomeVariacao(novoNome);

  async function escolher(id: string | null) {
    const anterior = selecionadaId;
    setLocalId(id);
    setPendente(true);
    setErro(null);
    try {
      await onSelect(id);
    } catch {
      setLocalId(anterior);
      setErro("Não deu pra trocar a variação.");
    } finally {
      setPendente(false);
    }
  }

  async function criarESelecionar() {
    if (!limpo) return;
    setErro(null);
    setCriando(true);
    try {
      await onCreate(limpo);
      setNovoNome("");
      setCriandoAberto(false);
    } catch {
      setErro("Não deu pra criar. Esse nome já existe?");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="relative block w-full">
        <select
          aria-label={`${rotuloPrefixo}: variação`}
          value={localId ?? ""}
          disabled={pendente || criando}
          onChange={(e) => {
            const v = e.target.value;
            void escolher(v === "" ? null : v);
          }}
          className="absolute inset-0 z-10 cursor-pointer appearance-none opacity-0 disabled:cursor-wait"
        >
          <option value="">Padrão</option>
          {variacoes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none flex min-h-11 w-full items-center justify-between rounded-xl bg-secondary px-3.5 text-[13px] font-semibold text-muted-foreground"
        >
          <span>
            {rotuloPrefixo}: {rotulo}
          </span>
          <ChevronDown className="opacity-60" size={16} />
        </span>
      </span>

      {criandoAberto ? (
        <div className="flex flex-col gap-2">
          <Input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            maxLength={40}
            autoComplete="off"
            placeholder="Ex.: Outra máquina ou com halter/barra"
            className="h-11 rounded-xl px-3.5 text-base"
          />
          <Button
            disabled={!limpo || criando}
            onClick={() => void criarESelecionar()}
            className="shadow-soft-elevated h-11 w-full rounded-xl"
          >
            {criando ? "Salvando..." : rotuloPrefixo === "Hoje" ? "Criar e usar hoje" : "Criar e usar"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCriandoAberto(true)}
          className="min-h-11 text-left text-[13px] font-semibold text-muted-foreground active:opacity-80"
        >
          + Nova variação
        </button>
      )}

      {erro && (
        <p role="alert" className="text-[13px] text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
