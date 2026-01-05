// shared/data/spells.data.ts
// Definições de spells do jogo
// Re-exporta templates e fornece funções utilitárias

import type { SpellDefinition } from "../types/spells.types";

// Re-exportar todos os templates de spells
export { TELEPORT, FIRE, EMPOWER } from "./Templates/SpellsTemplates";

import { TELEPORT, FIRE, EMPOWER } from "./Templates/SpellsTemplates";

/**
 * Lista completa de spells disponíveis no sistema
 */
export const ALL_SPELLS: SpellDefinition[] = [TELEPORT, FIRE, EMPOWER];

/**
 * Mapa de spells por código para acesso rápido
 */
export const SPELL_MAP: Record<string, SpellDefinition> = ALL_SPELLS.reduce(
  (acc, spell) => {
    acc[spell.code] = spell;
    return acc;
  },
  {} as Record<string, SpellDefinition>
);

/**
 * Obtém uma spell pelo código
 */
export function getSpellByCode(code: string): SpellDefinition | undefined {
  return SPELL_MAP[code];
}

/**
 * Ícones das spells para visualização
 */
export const SPELL_ICONS: Record<string, string> = {
  TELEPORT: "🌀",
  FIRE: "🔥",
  EMPOWER: "⚡",
};

/**
 * Cores das spells para UI
 */
export const SPELL_COLORS: Record<string, string> = {
  TELEPORT: "cyan",
  FIRE: "red",
  EMPOWER: "yellow",
};
