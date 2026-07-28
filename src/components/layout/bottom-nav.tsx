"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, Dumbbell, History, LayoutGrid } from "lucide-react";
import { useAppStore } from "@/lib/store";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/registro", label: "Registro", icon: CirclePlus },
  { href: "/treino", label: "Meu Treino", icon: Dumbbell },
  // `/exercicio/[id]` (singular) é o detalhe de um exercício e pertence à aba
  // Histórico. Um `startsWith("/exercicios")` não pega esse path — antes a
  // tela de detalhe ficava sem nenhuma aba marcada, justamente onde o usuário
  // cai vindo de "Ver histórico do exercício".
  { href: "/exercicios", label: "Histórico", icon: History, extraPrefix: "/exercicio/" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { refresh } = useAppStore();

  return (
    // No fluxo normal (reserva sua própria linha) — testado em dispositivo
    // real, um nav flutuante por cima do conteúdo deixava a área útil de
    // rolagem curta demais e escondia permanentemente o fim das listas.
    <nav
      className="flex-none border-t border-border bg-background"
      // min-height a partir da variável em vez de deixar o conteúdo decidir: é
      // ela que o ToastPill usa pra se posicionar acima do nav, então precisa
      // ser verdade e não estimativa.
      style={{ minHeight: "var(--rg-bottom-nav-h)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Sem padding no topo: o indicador da aba ativa encosta na border-t. */}
      <div className="grid grid-cols-4 gap-1 px-2 pb-2">
        {TABS.map((tab) => {
          const { href, label, icon: Icon } = tab;
          const extraPrefix = "extraPrefix" in tab ? tab.extraPrefix : undefined;
          const active = pathname.startsWith(href) || (extraPrefix ? pathname.startsWith(extraPrefix) : false);
          return (
            <Link
              key={href}
              href={href}
              // O Dashboard sempre carrega via navegação completa (window.location),
              // de qualquer aba — garante dados frescos com feedback visível de
              // reload. Nas demais abas, tocar na aba já ativa rebusca os dados
              // (é a mesma URL, então o Link sozinho não faria nada).
              onClick={(e) => {
                if (href === "/dashboard") {
                  e.preventDefault();
                  window.location.href = href;
                } else if (active) {
                  refresh();
                }
              }}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center gap-0.5 pt-2.5 pb-0.5 active:opacity-70"
            >
              {/* A cor não pode ser o único sinal de aba ativa. Fio de 2px
                  encostado na borda do nav, não o pill de antes. */}
              {active && <span aria-hidden className="absolute inset-x-2 top-0 h-0.5 rounded-b-full bg-primary" />}
              <Icon size={20} strokeWidth={2} className={active ? "text-primary" : "text-muted-foreground"} />
              <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
