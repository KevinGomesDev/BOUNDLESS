// src/data/skills.ts
import { SkillDefinition } from "../types";

/**
 * Definições de todas as habilidades do jogo
 * As habilidades são referenciadas pelas classes
 */
export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
  // ===== BÁRBARO =====
  BARBARIAN_WILD_FURY: {
    id: "BARBARIAN_WILD_FURY",
    name: "Fúria Selvagem",
    description:
      "Todo dano recebido é reduzido em 1. Ataques têm mínimo de 2 acertos. Duplicado sem Proteção.",
    category: "PASSIVA",
  },
  BARBARIAN_RECKLESS_ATTACK: {
    id: "BARBARIAN_RECKLESS_ATTACK",
    name: "Ataque Descuidado",
    description: "Sem Proteção: Pode atacar 2x quando usa Ação de Ataque.",
    category: "PASSIVA",
  },
  BARBARIAN_TOTAL_DESTRUCTION: {
    id: "BARBARIAN_TOTAL_DESTRUCTION",
    name: "Destruição Total",
    description:
      "Escolha dano de 1 até seu Combate em alvo adjacente. Você recebe o mesmo dano.",
    category: "ATIVA",
    costTier: "BAIXO",
    range: "ADJACENTE",
  },

  // ===== CLÉRIGO =====
  CLERIC_MAGIC: {
    id: "CLERIC_MAGIC",
    name: "Magia",
    description: "Pode conjurar Sana, Lumen e Borealis.",
    category: "PASSIVA",
  },
  CLERIC_CELESTIAL_EXPULSION: {
    id: "CLERIC_CELESTIAL_EXPULSION",
    name: "Expulsão Celestial",
    description:
      "Você e aliados adjacentes não podem ser afetados por Maldições.",
    category: "PASSIVA",
  },
  CLERIC_CHANNEL_DIVINITY: {
    id: "CLERIC_CHANNEL_DIVINITY",
    name: "Canalizar Divindade",
    description:
      "Você e aliados adjacentes recebem metade de Dano de Avatares (incluindo Dano Verdadeiro).",
    category: "PASSIVA",
  },

  // ===== GUERREIRO =====
  WARRIOR_EXTRA_ATTACK: {
    id: "WARRIOR_EXTRA_ATTACK",
    name: "Ataque Extra",
    description: "Quando usa Ação de Ataque, pode realizar um ataque a mais.",
    category: "PASSIVA",
  },
  WARRIOR_STRATEGIST: {
    id: "WARRIOR_STRATEGIST",
    name: "Estrategista Nato",
    description:
      "Caso falhe em Teste Resistido iniciado por você, tenha sucesso instantaneamente.",
    category: "REATIVA",
    costTier: "BAIXO",
  },
  WARRIOR_ACTION_SURGE: {
    id: "WARRIOR_ACTION_SURGE",
    name: "Surto de Ação",
    description: "Receba uma ação extra em seu turno. Não consome ação.",
    category: "ATIVA",
    costTier: "MEDIO",
  },
};
