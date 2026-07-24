import type { GrupoMuscular } from "@/lib/types";

/** Ordem canônica do catálogo — também usada como desempate estável no ranking. */
export const GRUPOS_MUSCULARES = [
  "ombros",
  "costas",
  "peito",
  "triceps",
  "biceps",
  "antebraco",
  "panturrilha",
  "abdomen",
  "gluteo",
  "posterior_de_coxa",
  "quadriceps",
  "trapezio",
  "adutores",
] as const satisfies readonly GrupoMuscular[];

export const LABEL_GRUPO_MUSCULAR: Record<GrupoMuscular, string> = {
  ombros: "Ombros",
  costas: "Costas",
  peito: "Peito",
  triceps: "Tríceps",
  biceps: "Bíceps",
  antebraco: "Antebraço",
  panturrilha: "Panturrilha",
  abdomen: "Abdômen",
  gluteo: "Glúteo",
  posterior_de_coxa: "Posterior de coxa",
  quadriceps: "Quadríceps",
  trapezio: "Trapézio",
  adutores: "Adutores",
};
