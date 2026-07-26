"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PAINEIS, type Panel } from "./landing-copy";
import { PainelFoco } from "./painel-foco";

// ssr:false só é permitido em Client Component (por isso este wrapper existe).
// Ver node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md.
const LandingStage = dynamic(() => import("./landing-3d-stage"), { ssr: false });

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function PainelResumo({
  p,
  align = "left",
  destaque = false,
}: {
  p: Panel;
  align?: "left" | "center";
  /** Tipografia maior — só o primeiro painel, que é o hero da página. */
  destaque?: boolean;
}) {
  const centralizado = align === "center";
  return (
    <div>
      <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">{p.eyebrow}</p>
      <h2
        className={cn(
          "mb-3 font-bold tracking-tight whitespace-pre-line",
          destaque ? "text-[2.5rem] leading-[1.05] sm:text-5xl" : "text-3xl sm:text-4xl",
        )}
      >
        {p.headline}
      </h2>
      {p.lede && (
        <p
          className={cn(
            "leading-relaxed text-muted-foreground",
            destaque ? "text-base sm:text-lg" : "text-[15px]",
            "max-w-[46ch]",
            centralizado && "mx-auto",
          )}
        >
          {p.lede}
        </p>
      )}
      {p.stats && (
        <div className={cn("mt-4 flex gap-12", centralizado && "justify-center")}>
          {p.stats.map((s) => (
            <div key={s.label} className={cn("flex flex-col", centralizado && "items-center")}>
              <span className="text-4xl font-bold tracking-tight text-primary">{s.num}</span>
              <span className="text-xs tracking-[0.06em] text-muted-foreground uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingHero() {
  // undefined enquanto não checou no cliente (evita mismatch de hidratação).
  const [reduzido, setReduzido] = useState<boolean | undefined>(undefined);
  const [ehMobile, setEhMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // matchMedia só existe no cliente — não há alternativa em tempo de render
    // que evite o mismatch de hidratação (por isso o placeholder abaixo).
    const mqReduzido = window.matchMedia(REDUCED_MOTION_QUERY);
    const mqMobile = window.matchMedia(MOBILE_QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduzido(mqReduzido.matches);
    setEhMobile(mqMobile.matches);
    const onChangeReduzido = (e: MediaQueryListEvent) => setReduzido(e.matches);
    const onChangeMobile = (e: MediaQueryListEvent) => setEhMobile(e.matches);
    mqReduzido.addEventListener("change", onChangeReduzido);
    mqMobile.addEventListener("change", onChangeMobile);
    return () => {
      mqReduzido.removeEventListener("change", onChangeReduzido);
      mqMobile.removeEventListener("change", onChangeMobile);
    };
  }, []);

  // Antes de resolver as duas preferências, reserva a altura da viewport (sem CLS).
  if (reduzido === undefined || ehMobile === undefined) return <div className="min-h-dvh" aria-hidden />;

  if (ehMobile) {
    // Mobile: sem celular — nem o palco 3D, nem o mockup estático. A cena foi
    // calibrada pra proporção larga do desktop e não cabe num viewport estreito
    // sem sobrepor o texto.
    //
    // Antes os 4 painéis eram seções idênticas separadas por border-t, o que
    // lia como 4 heros empilhados. Agora só o primeiro é hero (altura cheia,
    // tipografia maior, estático — já está em foco quando a página abre); os
    // outros três ficam juntos num bloco compacto e ganham o foco-ao-rolar,
    // que é a mesma linguagem do palco do desktop.
    const [heroPainel, ...painesRestantes] = PAINEIS;
    return (
      <>
        <section className="flex min-h-svh flex-col justify-center">
          {/* Precisa limpar o header fixo (~80px + safe-area inset): com o py-16
              padrão o eyebrow subia por baixo dos botões no iPhone. */}
          <div
            className="mx-auto w-full max-w-xl px-6 pb-16 text-center"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 7rem)" }}
          >
            <PainelResumo p={heroPainel} align="center" destaque />
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-xl flex-col gap-16 px-6 py-20 text-center">
            {painesRestantes.map((p, i) => (
              // `animar` respeita reduced-motion: este branch é retornado antes
              // da checagem de `reduzido` lá embaixo, então o desligamento tem
              // que acontecer aqui.
              <PainelFoco key={i} animar={!reduzido}>
                <PainelResumo p={p} align="center" />
              </PainelFoco>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (reduzido) {
    // Fallback estático (desktop, reduced-motion): painéis empilhados + imagem do app (sem Three.js/Draco).
    return (
      <section
        className="mx-auto grid max-w-6xl gap-16 px-6 py-16"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 7rem)" }}
      >
        <div className="relative mx-auto w-full max-w-[260px]">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card">
            <Image
              src="/marketing/dashboard-preview.png"
              alt="Tela inicial do TapGym com o treino do dia e o volume semanal"
              width={390}
              height={844}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
        <div className="grid gap-12">
          {PAINEIS.map((p, i) => (
            <PainelResumo key={i} p={p} />
          ))}
        </div>
      </section>
    );
  }

  return <LandingStage />;
}
