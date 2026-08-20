"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToastPill } from "@/components/ui/toast-pill";
import { CargaCard } from "@/components/registro/carga-card";
import { EditarSerieDialog } from "@/components/registro/editar-serie-dialog";
import { ExercicioTabs } from "@/components/registro/exercicio-tabs";
import { QualidadeIcon } from "@/components/registro/qualidade-icon";
import { QualidadePicker } from "@/components/registro/qualidade-picker";
import { RepsCard } from "@/components/registro/reps-card";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import { formatCarga, getTreinoDeHoje, shouldSugerirProgressao } from "@/lib/dashboard";
import { contextoObservacaoDoDia } from "@/lib/observacao-exercicio";
import { useAppStore } from "@/lib/store";
import { getDataLocalISO } from "@/lib/timezone";
import type { Qualidade, Serie } from "@/lib/types";
import {
  ultimaSerieDaClassificacao,
  variacaoIdDoDia,
  variacoesDoExercicio,
} from "@/lib/variacao-exercicio";

export default function RegistroPage() {
  const {
    treinos,
    treinoExercicios,
    exercicios,
    series,
    exercicioObservacoes,
    exercicioVariacoes,
    exercicioVariacoesDia,
    addSerie,
    updateSerie,
    removeSerie,
    salvarObservacaoExercicio,
    addVariacaoExercicio,
    setVariacaoDoDia,
    loading,
  } = useAppStore();
  const [serieEditando, setSerieEditando] = useState<Serie | null>(null);

  const treinoDeHoje = getTreinoDeHoje(treinos);
  const exerciciosDoDia = treinoDeHoje
    ? treinoExercicios
        .filter((te) => te.treino_id === treinoDeHoje.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map((te) => ({ ...te, exercicio: exercicios.find((e) => e.id === te.exercicio_id) }))
    : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const curEx = exerciciosDoDia[Math.min(activeIndex, Math.max(exerciciosDoDia.length - 1, 0))];

  function ultimaCargaDe(exercicioId: string): number {
    const hoje = getDataLocalISO(new Date());
    const varId = variacaoIdDoDia(exercicioVariacoesDia, exercicioId, hoje);
    const ultima = ultimaSerieDaClassificacao(series, exercicioVariacoesDia, exercicioId, varId);
    return ultima ? ultima.carga : 0;
  }

  const [carga, setCarga] = useState(0);
  const [reps, setReps] = useState(0);
  const [qualidade, setQualidade] = useState<Qualidade | null>(null);
  const [toast, setToast] = useState<{ msg: string; key: number } | null>(null);
  const [exercicioSincronizado, setExercicioSincronizado] = useState<string | undefined>(undefined);

  // Reseta os campos sempre que o exercício ativo muda, inclusive na
  // primeira vez que ele deixa de ser `undefined`, quando os dados terminam
  // de carregar. Sem isso, a carga inicial (calculada uma única vez, enquanto
  // a store ainda estava carregando) ficava travada em 0 depois de um
  // refresh ou de um deep-link direto pra /registro. Ajustado durante o
  // render (mesmo padrão de blur-commit-input.tsx) em vez de um efeito, pra
  // não custar um commit extra.
  if (curEx && curEx.exercicio_id !== exercicioSincronizado) {
    setExercicioSincronizado(curEx.exercicio_id);
    setCarga(ultimaCargaDe(curEx.exercicio_id));
    setReps(0);
    setQualidade(null);
  }

  const toastKeyRef = useRef(0);
  function mostrarToast(msg: string) {
    toastKeyRef.current += 1;
    setToast({ msg, key: toastKeyRef.current });
    window.setTimeout(() => setToast(null), 1800);
  }

  function selecionarExercicio(index: number) {
    setActiveIndex(index);
  }

  function onRepTap() {
    setReps((r) => r + 1);
  }

  // `salvando` existe pra bloquear o segundo toque: `addSerie` é assíncrono e,
  // sem isso, dois toques em rede ruim gravavam duas séries iguais.
  const [salvando, setSalvando] = useState(false);
  const faltando = [
    carga <= 0 ? "a carga" : null,
    reps <= 0 ? "as repetições" : null,
    qualidade === null ? "a qualidade" : null,
  ].filter((item): item is string => item !== null);
  const camposFaltando = Boolean(curEx) && faltando.length > 0;
  const podeSalvar = Boolean(curEx) && !salvando && carga > 0 && reps > 0 && qualidade !== null;

  async function onSave() {
    if (!curEx || !podeSalvar || !qualidade) return;
    setSalvando(true);
    try {
      await addSerie(curEx.exercicio_id, carga, reps, qualidade);
      setReps(0);
      mostrarToast("Série salva ✓");
    } catch {
      mostrarToast("Não deu pra salvar. Tenta de novo");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <>
        <AppHeader variant="title" title="Registro" />
        <main className="flex flex-1 items-center justify-center px-8">
          <TypographyMuted className="text-center">Carregando...</TypographyMuted>
        </main>
      </>
    );
  }

  if (!treinoDeHoje || !curEx || !curEx.exercicio) {
    let mensagem = "Nenhum exercício cadastrado no treino de hoje. Adicione exercícios em “Meu Treino”.";
    if (treinos.length === 0) {
      mensagem = "Nenhum treino cadastrado ainda. Crie seus treinos em “Meu Treino”.";
    } else if (!treinoDeHoje) {
      mensagem = "Hoje é seu dia de descanso 🎉 Nenhum treino está agendado para hoje.";
    }

    return (
      <>
        <AppHeader variant="title" title="Registro" />
        <main className="flex flex-1 items-center justify-center px-8">
          <TypographyMuted className="text-center">{mensagem}</TypographyMuted>
        </main>
      </>
    );
  }

  const seriesDoExercicio = series.filter((s) => s.exercicio_id === curEx.exercicio_id);
  // Fuso fixo do app, não o do navegador, mantém "hoje" consistente com o
  // que a API (/api/hoje, rodando na Vercel em UTC) calcula.
  const hojeStr = getDataLocalISO(new Date());
  const variacaoHojeId = variacaoIdDoDia(exercicioVariacoesDia, curEx.exercicio_id, hojeStr);
  const ultima = ultimaSerieDaClassificacao(
    series,
    exercicioVariacoesDia,
    curEx.exercicio_id,
    variacaoHojeId,
  );
  const setsDeHoje = seriesDoExercicio
    .filter((s) => getDataLocalISO(new Date(s.data)) === hojeStr)
    .sort((a, b) => a.data.localeCompare(b.data));
  const numeroProximaSerie = setsDeHoje.length + 1;
  const sugereProgressao = shouldSugerirProgressao(reps, curEx.rep_max, qualidade);
  const obsEdicao = contextoObservacaoDoDia(exercicioObservacoes, serieEditando);

  return (
    <>
      <AppHeader variant="title" title="Registro" />
      {/* pt-6: espaço pro brilho do shadow-soft-elevated do primeiro card não
          ser cortado pela borda deste container com overflow (ver dashboard/page.tsx). */}
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-6 pb-4">
        <div className="flex flex-col gap-4">
          <ExercicioTabs
            nomes={exerciciosDoDia.map((te) => te.exercicio?.nome ?? "")}
            activeIndex={activeIndex}
            onSelect={selecionarExercicio}
          />

          <div className="flex items-center gap-2">
            <Badge variant="secondary" appearance="stroke" className="h-6 w-fit px-3 py-1">
              {treinoDeHoje.nome.toUpperCase()}
            </Badge>
            <Badge variant="primary" appearance="solid" className="h-6 w-fit px-3 py-1">
              SÉRIE {numeroProximaSerie} DE {curEx.num_series}
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            <TypographyH1>{curEx.exercicio.nome}</TypographyH1>
            <TypographyMuted className="flex items-center gap-1.5">
              {ultima ? (
                <>
                  Última: {formatCarga(ultima.carga)} kg × {ultima.reps}
                  <QualidadeIcon qualidade={ultima.qualidade} />
                </>
              ) : (
                "Sem registros ainda"
              )}
            </TypographyMuted>
          </div>
        </div>

        <CargaCard carga={carga} onChange={setCarga} />

        <RepsCard
          reps={reps}
          repMin={curEx.rep_min}
          repMax={curEx.rep_max}
          onTap={onRepTap}
          onMinus={() => setReps((r) => Math.max(0, r - 1))}
        />

        <QualidadePicker qualidade={qualidade} onChange={setQualidade} />

        {sugereProgressao && (
          <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-[13px] font-medium text-success">
            Bateu o topo da faixa com boa qualidade. Na próxima sessão, suba a carga.
          </p>
        )}

        {setsDeHoje.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Séries de hoje:</span>
            {/* A pílula inteira é o alvo de toque e abre a edição (que também
                apaga). Antes havia dois botões de ícone de 11 e 12px colados
                um no outro dentro dela, o de apagar era destrutivo e ficava a
                4px do de editar. */}
            <div className="flex flex-wrap items-center gap-2">
              {setsDeHoje.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSerieEditando(s)}
                  aria-label={`Editar série ${i + 1}: ${formatCarga(s.carga)} kg por ${s.reps} repetições`}
                  className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs text-muted-foreground active:opacity-70"
                >
                  Série {i + 1}: {formatCarga(s.carga)}kg × {s.reps}
                  <QualidadeIcon qualidade={s.qualidade} size={12} />
                  <Pencil size={12} className="text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col border-t border-border pt-3">
          <Link
            href={`/exercicio/${curEx.exercicio_id}`}
            className="mb-2 flex items-center justify-center gap-1 text-[13px] font-semibold text-muted-foreground active:opacity-70"
          >
            Ver histórico do exercício
            <ChevronRight size={16} />
          </Link>
          <Button
            onClick={onSave}
            disabled={!podeSalvar}
            className="h-[60px] w-full rounded-2xl text-[17px] font-bold"
          >
            {salvando ? "Salvando..." : "Salvar série"}
          </Button>
          {/* Botão desabilitado sem motivo visível fazia o usuário adivinhar o
              que faltava, quase sempre a qualidade, que fica acima da dobra. */}
          {camposFaltando && !salvando && (
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Falta informar {faltando.join(" e ")}.
            </p>
          )}
        </div>
      </main>

      <ToastPill message={toast?.msg ?? null} toastKey={toast?.key ?? 0} />

      <EditarSerieDialog
        serie={serieEditando}
        observacaoDia={obsEdicao.texto}
        ultimaObservacao={obsEdicao.ultima}
        variacoes={variacoesDoExercicio(exercicioVariacoes, serieEditando?.exercicio_id ?? curEx.exercicio_id)}
        variacaoDiaId={
          serieEditando
            ? variacaoIdDoDia(exercicioVariacoesDia, serieEditando.exercicio_id, obsEdicao.dataISO)
            : null
        }
        onCreateVariacao={(nome) =>
          addVariacaoExercicio(serieEditando?.exercicio_id ?? curEx.exercicio_id, nome)
        }
        onOpenChange={(open) => !open && setSerieEditando(null)}
        onSave={async (serieId, carga, reps, qualidade, observacao, variacaoId) => {
          if (!serieEditando) return;
          await updateSerie(serieId, carga, reps, qualidade);
          await salvarObservacaoExercicio(serieEditando.exercicio_id, obsEdicao.dataISO, observacao);
          await setVariacaoDoDia(serieEditando.exercicio_id, obsEdicao.dataISO, variacaoId);
        }}
        onDelete={removeSerie}
      />
    </>
  );
}
