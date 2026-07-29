"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Depoimentos fora do critical path: o chunk só baixa quando a seção
 * aproxima da viewport. Evita Unsplash/JS do marquee competirem com LCP/TBT.
 */
const LandingTestimonials = dynamic(
  () => import("./landing-testimonials").then((m) => m.LandingTestimonials),
  { ssr: false, loading: () => <div className="min-h-[280px] border-t border-border" aria-hidden /> },
);

export function LandingTestimonialsLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [visível, setVisível] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisível(true);
        io.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{visível ? <LandingTestimonials /> : <div className="min-h-[280px] border-t border-border" aria-hidden />}</div>;
}
