import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Escala tipográfica do app, seguindo a mesma lógica do padrão de Typography
 * do shadcn/ui (pesos e tracking por nível), mas calibrada pro tamanho de
 * tela mobile do TapGym em vez dos tamanhos de blog do exemplo original
 * (h1 de 36px não cabe num header de app; aqui o maior título é 22-26px).
 */

export function TypographyH1({ className, ...props }: ComponentProps<"h1">) {
  return <h1 className={cn("text-[22px] font-extrabold tracking-tight text-balance", className)} {...props} />;
}

export function TypographyH2({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-extrabold tracking-tight", className)} {...props} />;
}

export function TypographyH3({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-[17px] font-bold tracking-tight", className)} {...props} />;
}

export function TypographyH4({ className, ...props }: ComponentProps<"h4">) {
  return <h4 className={cn("text-[15px] font-bold tracking-tight", className)} {...props} />;
}

export function TypographyP({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[15px] leading-relaxed", className)} {...props} />;
}

export function TypographyLead({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[13px] text-muted-foreground", className)} {...props} />;
}

export function TypographySmall({ className, ...props }: ComponentProps<"small">) {
  return <small className={cn("text-[13px] leading-none font-medium", className)} {...props} />;
}

export function TypographyMuted({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[13px] text-muted-foreground", className)} {...props} />;
}

/**
 * Título de uma seção da página (ex: "Exercícios de hoje", acima de uma lista
 * de rows). Nível acima do Eyebrow de propósito: os dois eram o mesmo estilo,
 * então rótulo de card e título de seção ficavam indistinguíveis e não se via o
 * que estava dentro do quê.
 */
export function TypographySectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-[15px] font-bold tracking-tight", className)} {...props} />;
}

/** Rótulo pequeno em versalete usado no topo de um card (ex: "TREINO DE HOJE"). */
export function TypographyEyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[11px] font-bold text-muted-foreground uppercase", className)}
      {...props}
    />
  );
}
