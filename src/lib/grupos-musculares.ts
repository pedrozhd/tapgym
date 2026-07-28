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

/**
 * Região do corpo de cada grupamento. Não existe no banco: serve pra colorir e
 * agrupar na interface sem precisar de uma cor por grupamento (treze cores
 * viram confete). "empurrar"/"puxar" é a divisão que quem treina já usa.
 */
export type RegiaoMuscular = "empurrar" | "puxar" | "pernas" | "core";

export const REGIAO_GRUPO_MUSCULAR: Record<GrupoMuscular, RegiaoMuscular> = {
  ombros: "empurrar",
  peito: "empurrar",
  triceps: "empurrar",
  costas: "puxar",
  biceps: "puxar",
  antebraco: "puxar",
  trapezio: "puxar",
  quadriceps: "pernas",
  posterior_de_coxa: "pernas",
  gluteo: "pernas",
  panturrilha: "pernas",
  adutores: "pernas",
  abdomen: "core",
};

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
