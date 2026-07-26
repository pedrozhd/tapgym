"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ShortcutDialog } from "@/components/layout/shortcut-dialog";
import { useIOS } from "@/lib/use-ios";

interface AppHeaderProps {
  variant: "dashboard" | "title" | "back";
  title?: string;
  backHref?: string;
  onBack?: () => void;
  userName?: string;
  onAvatarClick?: () => void;
}

export function AppHeader({
  variant,
  title,
  backHref = "/dashboard",
  onBack,
  userName = "Você",
  onAvatarClick,
}: AppHeaderProps) {
  const [shortcutOpen, setShortcutOpen] = useState(false);
  // O app Atalhos só existe no iOS. Fora dele o botão abriria instruções que
  // não têm como funcionar no aparelho.
  const ehIOS = useIOS();

  if (variant === "dashboard") {
    const inicial = userName.trim().charAt(0).toUpperCase();
    return (
      <header className="flex flex-none items-center justify-between px-5 pt-5 pb-3.5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Olá{userName ? `, ${userName}` : ""}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Bora treinar hoje?</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ehIOS && (
            <button
              type="button"
              onClick={() => setShortcutOpen(true)}
              aria-label="Atalho do iPhone"
              className="shadow-soft-elevated flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary"
            >
              <Zap size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label="Conta"
            className="shadow-soft-elevated flex h-10 w-10 items-center justify-center rounded-full bg-card text-[15px] font-bold"
          >
            {inicial}
          </button>
        </div>

        <ShortcutDialog open={shortcutOpen} onOpenChange={setShortcutOpen} />
      </header>
    );
  }

  if (variant === "back") {
    const backButtonClassName = "-ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-xl";
    return (
      <header className="flex flex-none items-center gap-2 px-5 pt-5 pb-3.5">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Voltar" className={backButtonClassName}>
            ←
          </button>
        ) : (
          <Link href={backHref} aria-label="Voltar" className={backButtonClassName}>
            ←
          </Link>
        )}
        <h1 className="flex-1 truncate text-[17px] font-bold tracking-tight">{title}</h1>
      </header>
    );
  }

  return (
    <header className="flex flex-none items-center justify-between px-5 pt-5 pb-3.5">
      <h1 className="text-lg font-extrabold tracking-tight">{title}</h1>
    </header>
  );
}
