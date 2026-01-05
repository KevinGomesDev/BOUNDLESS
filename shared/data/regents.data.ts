// shared/data/regents.data.ts
// Templates de Regentes pré-definidos (vinculados aos Templates de Reinos)
// Regentes são unidades especiais que lideram o Reino
// Re-exporta templates e fornece funções utilitárias

import type { Alignment } from "../types/kingdom.types";

// Re-exportar tipos e templates
export type { RegentTemplate } from "./Templates/RegentTemplates";
export { SERAPHINA, MALACHAR, IGNATHARAX } from "./Templates/RegentTemplates";

import {
  SERAPHINA,
  MALACHAR,
  IGNATHARAX,
  type RegentTemplate,
} from "./Templates/RegentTemplates";

// =============================================================================
// LISTA DE TODOS OS REGENTES
// =============================================================================

export const REGENT_TEMPLATES: RegentTemplate[] = [
  SERAPHINA,
  MALACHAR,
  IGNATHARAX,
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Busca um regente pelo código
 */
export function getRegentTemplate(code: string): RegentTemplate | undefined {
  return REGENT_TEMPLATES.find((r) => r.code === code);
}

/**
 * Lista regentes por alinhamento
 */
export function getRegentsByAlignment(alignment: Alignment): RegentTemplate[] {
  return REGENT_TEMPLATES.filter((r) => r.alignment === alignment);
}

/**
 * Retorna os atributos totais do regente (soma)
 * Regentes devem ter soma = 30
 */
export function getRegentTotalAttributes(regent: RegentTemplate): number {
  return (
    regent.combat + regent.speed + regent.focus + regent.armor + regent.vitality
  );
}

/**
 * Valida se os atributos do regente estão corretos
 */
export function validateRegentAttributes(regent: RegentTemplate): {
  valid: boolean;
  total: number;
  expected: number;
} {
  const total = getRegentTotalAttributes(regent);
  const expected = 30; // Regentes têm 30 pontos de atributo
  return { valid: total === expected, total, expected };
}
