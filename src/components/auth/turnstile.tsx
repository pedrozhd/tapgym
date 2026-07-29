"use client";

import Script from "next/script";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export interface TurnstileHandle {
  /** Chamar depois de qualquer tentativa de signUp/signIn (sucesso ou erro):
   *  o token do Turnstile é de uso único e expira em poucos minutos. */
  reset: () => void;
}

/**
 * Widget do Cloudflare Turnstile (captcha do cadastro e do login). Exige
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — a chave pública, não a secret (essa fica
 * só na configuração de Attack Protection do Supabase).
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(
  function Turnstile({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    const renderizar = useCallback(() => {
      if (!window.turnstile || !containerRef.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }, [onToken]);

    useImperativeHandle(ref, () => ({
      reset() {
        if (window.turnstile && widgetId.current) {
          onToken(null);
          window.turnstile.reset(widgetId.current);
        }
      },
    }));

    return (
      <>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" onReady={renderizar} />
        <div ref={containerRef} />
      </>
    );
  },
);
