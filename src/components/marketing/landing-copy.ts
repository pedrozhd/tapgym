export interface PanelStat {
  num: string;
  label: string;
}

export interface Panel {
  eyebrow: string;
  headline: string;
  /** Só no painel com ciclo de palavra: tudo do headline antes da palavra que alterna. */
  headlinePrefixo?: string;
  /** Só no painel com ciclo de palavra: tudo do headline depois da palavra que alterna. */
  headlineSufixo?: string;
  /** Palavras que alternam a cada ~2s (GSAP) no lugar da última palavra do headline. */
  cicloPalavras?: string[];
  lede?: string;
  align: "left" | "right";
  stats?: PanelStat[];
  hint?: boolean;
}

// Copy dos 4 painéis do palco 3D. Compartilhada entre o palco animado
// (landing-3d-stage) e o fallback estático (landing-hero). `headline` aceita
// "\n" para quebras de linha intencionais.
export const PAINEIS: Panel[] = [
  {
    eyebrow: "tapgym",
    headline: "Cada treino,\num degrau.",
    headlinePrefixo: "Cada treino,\num ",
    headlineSufixo: ".",
    cicloPalavras: ["degrau", "passo", "recorde", "avanço"],
    lede: "O app que transforma sua evolução na academia em números que fazem sentido.",
    align: "left",
    hint: true,
  },
  {
    eyebrow: "feito pro seu bolso",
    headline: "No seu celular.\nNa sua mochila.\nNo seu treino.",
    lede: "Sem planilha, sem caderninho. Seu histórico de carga sempre à mão, direto na palma da mão.",
    align: "right",
  },
  {
    eyebrow: "progressão automática",
    headline: "Registre a carga.\nA gente calcula o resto.",
    lede: "O TapGym acompanha cada série e mostra o próximo passo, sem achismo e sem estagnar.",
    align: "left",
  },
  {
    eyebrow: "resultado real",
    headline: "Quem registra,\nevolui mais rápido.",
    align: "right",
    stats: [
      { num: "+12%", label: "carga em 30 dias" },
      { num: "0", label: "planilhas perdidas" },
    ],
  },
];
