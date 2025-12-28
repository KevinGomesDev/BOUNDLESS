// src/data/classes.ts
import { ClassDefinition } from "../types";

export const CLASS_DEFINITIONS: Record<string, ClassDefinition> = {
  BARBARIAN: {
    id: "BARBARIAN",
    name: "Bárbaro",
    archetype: "FISICA",
    resourceUsed: "COMIDA", // Física usa Comida
    description:
      "Guerreiro selvagem que ganha força com a fúria. Pode atacar múltiplas vezes sem proteção.",
    skills: [
      {
        id: "BARBARIAN_WILD_FURY",
        name: "Fúria Selvagem",
        description:
          "Todo dano recebido reduzido em 1. Ataques têm mínimo 2 de acertos. Duplicado sem Proteção.",
        category: "PASSIVA",
      },
      {
        id: "BARBARIAN_RECKLESS_ATTACK",
        name: "Ataque Descuidado",
        description: "Sem Proteção: Pode atacar 2x quando usa Ação de Ataque.",
        category: "PASSIVA",
      },
      {
        id: "BARBARIAN_TOTAL_DESTRUCTION",
        name: "Destruição Total",
        description:
          "Escolha dano de 1 até seu Combate em alvo adjacente. Você recebe o mesmo dano.",
        category: "ATIVA",
        costTier: "BAIXO",
        range: "ADJACENTE",
      },
    ],
  },

  WARRIOR: {
    id: "WARRIOR",
    name: "Guerreiro",
    archetype: "FISICA",
    resourceUsed: "COMIDA", // Física usa Comida
    description:
      "Soldado disciplinado e experiente. Mestre em ataques múltiplos e em recuperação tática.",
    skills: [
      {
        id: "WARRIOR_EXTRA_ATTACK",
        name: "Ataque Extra",
        description:
          "Quando usa a Ação de Ataque, você pode realizar um ataque a mais.",
        category: "PASSIVA",
      },
      {
        id: "WARRIOR_STRATEGIST",
        name: "Estrategista Nato",
        description:
          "Caso falhe em um Teste Resistido iniciado por você, tenha sucesso instantaneamente.",
        category: "REATIVA",
        costTier: "BAIXO",
      },
      {
        id: "WARRIOR_ACTION_SURGE",
        name: "Surto de Ação",
        description:
          "Você recebe uma ação extra em seu turno. Não consome ação.",
        category: "ATIVA",
        costTier: "MEDIO",
      },
    ],
  },

  CLERIC: {
    id: "CLERIC",
    name: "Clérigo",
    archetype: "ESPIRITUAL",
    resourceUsed: "DEVOCAO",
    description:
      "Escolhido divino com poderes sagrados. Protege aliados e expele maldições.",
    skills: [
      {
        id: "CLERIC_MAGIC",
        name: "Magia",
        description: "Pode conjurar Sana, Lumen e Borealis.",
        category: "PASSIVA",
      },
      {
        id: "CLERIC_CELESTIAL_EXPULSION",
        name: "Expulsão Celestial",
        description:
          "Você e aliados adjacentes não podem ser afetados por Maldições.",
        category: "PASSIVA",
      },
      {
        id: "CLERIC_CHANNEL_DIVINITY",
        name: "Canalizar Divindade",
        description:
          "Você e aliados adjacentes recebem metade de Dano de Avatares (incluindo Dano Verdadeiro).",
        category: "PASSIVA",
      },
    ],
  },
};
