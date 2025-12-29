// src/data/skills.ts
// Definições de sistemas de habilidades (custo, range, categorias)

export type SkillCategory = "ATIVA" | "REATIVA" | "PASSIVA";
export type SkillCostTier = "BAIXO" | "MEDIO" | "ALTO"; // 1, 2, 3
export type RangeType = "ADJACENTE" | "BAIXO" | "MEDIO" | "ALTO"; // 1, 2, 4, 6

// Helper para traduzir Tier em Número
export const COST_VALUES: Record<SkillCostTier, number> = {
  BAIXO: 1,
  MEDIO: 2,
  ALTO: 3,
};

export const RANGE_VALUES: Record<RangeType, number> = {
  ADJACENTE: 1,
  BAIXO: 2,
  MEDIO: 4,
  ALTO: 6,
};

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;

  // Apenas para Ativas e Reativas
  costTier?: SkillCostTier;
  range?: RangeType;
}
