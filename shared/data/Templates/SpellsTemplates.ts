// shared/data/Templates/SpellsTemplates.ts
// Templates raw de todas as spells do jogo

import type { SpellDefinition } from "../../types/spells.types";

/**
 * 🌀 TELEPORT
 * Move instantaneamente para uma posição no alcance
 */
export const TELEPORT: SpellDefinition = {
  code: "TELEPORT",
  name: "Teleporte",
  description:
    "Move-se instantaneamente para uma posição dentro do alcance, ignorando obstáculos e unidades.",
  range: "RANGED",
  targetType: "POSITION",
  functionName: "executeTeleport",
  icon: "🌀",
  color: "cyan",
  cooldown: 3,
  manaCost: 5,
};

/**
 * 🔥 FIRE
 * Causa dano mágico em área
 */
export const FIRE: SpellDefinition = {
  code: "FIRE",
  name: "Fogo",
  description:
    "Lança uma bola de fogo em uma posição, causando dano mágico a todas as unidades na área (3x3). Dano baseado no Focus do conjurador.",
  range: "RANGED",
  targetType: "POSITION",
  functionName: "executeFire",
  icon: "🔥",
  color: "red",
  cooldown: 2,
  manaCost: 8,
};

/**
 * ⚡ EMPOWER
 * Potencializa unidade adjacente temporariamente
 */
export const EMPOWER: SpellDefinition = {
  code: "EMPOWER",
  name: "Potencializar",
  description:
    "Potencializa uma unidade adjacente, aumentando todos os seus atributos em 50% do seu Focus até o começo do próximo turno. Após o efeito, aplica penalidade pela mesma duração.",
  range: "ADJACENT",
  targetType: "ALLY",
  functionName: "executeEmpower",
  icon: "⚡",
  color: "yellow",
  cooldown: 4,
  manaCost: 6,
};
