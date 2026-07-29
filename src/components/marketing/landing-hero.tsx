"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PAINEIS, type Panel } from "./landing-copy";
import { LandingLoader } from "./landing-loader";

// ssr:false só é permitido em Client Component (por isso este wrapper existe).
// Ver node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md.
const LandingStage = dynamic(() => import("./landing-3d-stage"), {
  ssr: false,
  loading: () => <LandingLoader />,
});

// GSAP só entra quando o mobile confirma animação — não no SSR/hidratação.
const PainelFoco = dynamic(() => import("./painel-foco").then((m) => m.PainelFoco), {
  ssr: false,
});

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

function MobileHero({ animar }: { animar: boolean }) {
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
          {painesRestantes.map((p, i) =>
            animar ? (
              <PainelFoco key={i} animar>
                <PainelResumo p={p} align="center" />
              </PainelFoco>
            ) : (
              <div key={i}>
                <PainelResumo p={p} align="center" />
              </div>
            ),
          )}
        </div>
      </section>
    </>
  );
}

function DesktopEstatico() {
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

/**
 * Hero da LP: mobile-first no HTML.
 *
 * O Lighthouse mobile media LCP no H2 "Cada treino, um degrau.". Se esse texto
 * só existir depois do matchMedia no cliente, o element render delay estoura
 * (~1,6s no report). Por isso o markup mobile vai no SSR; no desktop (>=md)
 * um loader CSS cobre o first paint até o JS escolher o palco 3D ou o fallback
 * estático — sem spoiler das seções de baixo e sem atrasar o LCP no celular.
 */
export default function LandingHero() {
  const [ehMobile, setEhMobile] = useState<boolean | null>(null);
  const [reduzido, setReduzido] = useState(false);

  useEffect(() => {
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

  // Desktop confirmado: palco 3D ou fallback estático (reduced-motion).
  if (ehMobile === false) {
    return reduzido ? <DesktopEstatico /> : <LandingStage />;
  }

  // Mobile, ou ainda pendente (SSR + hidratação): H2 no HTML para o LCP.
  // Em viewports md+ o hero mobile fica oculto e o loader fixo cobre o paint
  // até o efeito acima promover para LandingStage.
  return (
    <>
      <div className="md:hidden">
        <MobileHero animar={ehMobile === true && !reduzido} />
      </div>
      {ehMobile === null && (
        <div className="hidden md:block">
          <LandingLoader />
        </div>
      )}
    </>
  );
}
