// src/data/classes.ts
import { ClassDefinition } from "../types";

export const CLASS_DEFINITIONS: Record<string, ClassDefinition> = {
  WARRIOR: {
    id: "WARRIOR",
    name: "Guerreiro",
    archetype: "FISICA",
    resourceUsed: "COMIDA", // Física usa Suprimento/Comida
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
        costTier: "BAIXO", // Custo Base: 1 Comida
      },
      {
        id: "WARRIOR_ACTION_SURGE",
        name: "Surto de Ação",
        description:
          "Você recebe uma ação extra em seu turno. Não consome ação.",
        category: "ATIVA",
        costTier: "MEDIO", // Custo Base: 2 Comida
      },
    ],
  },
  CLERIC: {
    id: "CLERIC",
    name: "Clérigo",
    archetype: "ESPIRITUAL",
    resourceUsed: "DEVOCAO",
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
        description: "Você e aliados adjacentes são imunes a Maldições.",
        category: "PASSIVA",
        range: "ADJACENTE",
      },
      {
        id: "CLERIC_CHANNEL_DIVINITY",
        name: "Canalizar Divindade",
        description:
          "Você e aliados adjacentes recebem metade do dano de Avatares.",
        category: "PASSIVA",
        range: "ADJACENTE",
      },
    ],
  },
};
