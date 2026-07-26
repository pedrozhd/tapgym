"use client";

import { useEffect, useState } from "react";

/**
 * `true` em iPhone/iPad, `false` no resto, `undefined` até checar no cliente.
 *
 * Serve pra esconder o atalho (app Atalhos só existe no iOS) de quem não pode
 * usá-lo. O `undefined` inicial evita mismatch de hidratação: quem chama deve
 * não renderizar nada enquanto for undefined.
 *
 * O segundo teste pega iPad no iOS 13+, que se identifica como "MacIntel" no
 * user agent e só se distingue de um Mac de verdade pelo suporte a toque.
 * `navigator.platform` é deprecado mas continua sendo o caminho usual pra isso.
 * Errar aqui custa só cosmética, não segurança.
 */
export function useIOS(): boolean | undefined {
  const [ehIOS, setEhIOS] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const ua = navigator.userAgent;
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEhIOS(/iPad|iPhone|iPod/.test(ua) || iPadOS);
  }, []);

  return ehIOS;
}
