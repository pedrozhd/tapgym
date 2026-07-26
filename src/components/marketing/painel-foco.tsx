"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Painel que sobe, assenta em foco e sai inclinando, conforme a rolagem.
 *
 * É a mesma linguagem do palco 3D do desktop (também GSAP + ScrollTrigger), mas
 * aplicada ao texto no mobile — onde o palco não roda. Por isso NÃO anima
 * `filter`: o efeito de referência borrava e estourava contraste, o que funciona
 * em foto e deixa texto ilegível para quem para de rolar no meio do trajeto.
 * Só transform e opacity, que além de legíveis são compositáveis (baratos no
 * Safari mobile).
 *
 * A timeline tem um trecho parado no meio de propósito: o painel assenta antes
 * do centro e FICA nítido durante a maior parte do tempo em que está visível,
 * em vez de estar correto só num ponto exato da rolagem.
 */
export function PainelFoco({ children, animar }: { children: ReactNode; animar: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!animar || !el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      tl.fromTo(
        el,
        { y: 40, rotateX: 10, scale: 0.985, opacity: 0.4, transformPerspective: 800 },
        { y: 0, rotateX: 0, scale: 1, opacity: 1, duration: 0.35, ease: "power2.out" },
      )
        // Trecho nítido — nada anima aqui.
        .to(el, { duration: 0.3 })
        .to(el, {
          y: -40,
          rotateX: -10,
          scale: 0.985,
          opacity: 0.4,
          duration: 0.35,
          ease: "power2.in",
        });
    }, el);

    return () => ctx.revert();
  }, [animar]);

  return (
    <div ref={ref} style={animar ? { willChange: "transform, opacity" } : undefined}>
      {children}
    </div>
  );
}
