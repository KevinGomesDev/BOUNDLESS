// src/utils/battle.utils.ts
import { SkillDefinition, COST_VALUES } from "../types";

/**
 * Calcula o custo de uso de uma habilidade baseado em quantas vezes ela já foi usada.
 * Regra: Custo Base * (2 ^ numeroDeUsosAnteriores)
 */
export function calculateSkillCost(
  skill: SkillDefinition,
  timesUsedInBattle: number
): number {
  if (skill.category === "PASSIVA" || !skill.costTier) {
    return 0;
  }

  const baseCost = COST_VALUES[skill.costTier];

  // Exemplo Prático (Habilidade Custo Médio = 2):
  // 1º uso (timesUsed=0): 2 * (2^0) = 2 * 1 = 2
  // 2º uso (timesUsed=1): 2 * (2^1) = 2 * 2 = 4
  // 3º uso (timesUsed=2): 2 * (2^2) = 2 * 4 = 8

  return baseCost * Math.pow(2, timesUsedInBattle);
}
