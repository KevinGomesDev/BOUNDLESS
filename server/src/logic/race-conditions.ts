// server/src/logic/race-conditions.ts
// Condições aplicadas pelas passivas de raça
// FONTE DE VERDADE para condições de raça

import type { ConditionDefinition } from "../../../shared/types/conditions.types";

/**
 * Condições de passivas de raça
 * Todas têm expiry: "permanent" pois são passivas raciais
 */
export const RACE_CONDITIONS: Record<string, ConditionDefinition> = {
  // =========================================================================
  // ABERRAÇÃO - Pele Amorfa
  // =========================================================================
  PELE_AMORFA: {
    id: "PELE_AMORFA",
    name: "Pele Amorfa",
    description: "Reduz todos os tipos de danos recebidos em 1.",
    expiry: "permanent",
    icon: "🫠",
    color: "#8e44ad",
    effects: {
      damageReduction: 1,
    },
  },

  // =========================================================================
  // BESTA - Fúria da Matilha
  // =========================================================================
  FURIA_DA_MATILHA: {
    id: "FURIA_DA_MATILHA",
    name: "Fúria da Matilha",
    description: "Bestas ganham poder quando aliados da mesma raça morrem.",
    expiry: "permanent",
    icon: "🐺",
    color: "#8b4513",
    effects: {
      // Efeito é processado manualmente quando Besta aliada morre
    },
  },

  // Buff temporário aplicado quando aliado Besta morre
  FURIA_DA_MATILHA_ATIVA: {
    id: "FURIA_DA_MATILHA_ATIVA",
    name: "Fúria da Matilha Ativa",
    description: "+1D na próxima rolagem (aliado Besta morreu).",
    expiry: "on_action",
    icon: "🐺",
    color: "#c0392b",
    effects: {
      // Implementado como vantagem em rolagens
    },
  },

  // =========================================================================
  // CELESTIAL - Luz Sagrada
  // =========================================================================
  LUZ_SAGRADA: {
    id: "LUZ_SAGRADA",
    name: "Luz Sagrada",
    description:
      "Causa o dobro de dano em Diabos, Monstruosidades e Mortos-Vivos.",
    expiry: "permanent",
    icon: "✨",
    color: "#ffd700",
    effects: {
      // Efeito é processado manualmente no cálculo de dano
    },
  },

  // =========================================================================
  // CONSTRUTO - Peso de Ferro
  // =========================================================================
  PESO_DE_FERRO: {
    id: "PESO_DE_FERRO",
    name: "Peso de Ferro",
    description: "Não pode ser arremessado, agarrado ou derrubado.",
    expiry: "permanent",
    icon: "🤖",
    color: "#95a5a6",
    effects: {
      immuneToConditions: ["GRAPPLED", "PRONE"],
    },
  },

  // =========================================================================
  // DRAGÃO - Sangue Arcano
  // =========================================================================
  SANGUE_ARCANO: {
    id: "SANGUE_ARCANO",
    name: "Sangue Arcano",
    description: "Reduz o custo de Arcana para Magias em 2.",
    expiry: "permanent",
    icon: "🐉",
    color: "#c0392b",
    effects: {
      // Efeito é processado manualmente no custo de magias
    },
  },

  // =========================================================================
  // ELEMENTAL - Afinidade Elemental
  // =========================================================================
  AFINIDADE_ELEMENTAL: {
    id: "AFINIDADE_ELEMENTAL",
    name: "Afinidade Elemental",
    description: "Imune a um elemento, vulnerável a outro.",
    expiry: "permanent",
    icon: "🌊",
    color: "#e67e22",
    effects: {
      // Efeito é configurado por unidade (escolha de elementos)
    },
  },

  // =========================================================================
  // FADA - Graça Feérica
  // =========================================================================
  GRACA_FEERICA: {
    id: "GRACA_FEERICA",
    name: "Graça Feérica",
    description: "Imune a efeitos negativos de Climas.",
    expiry: "permanent",
    icon: "🧚",
    color: "#9b59b6",
    effects: {
      // Efeito é processado manualmente em efeitos de clima
    },
  },

  // =========================================================================
  // DIABO - Chamas do Inferno
  // =========================================================================
  CHAMAS_DO_INFERNO: {
    id: "CHAMAS_DO_INFERNO",
    name: "Chamas do Inferno",
    description: "Causa o dobro de dano em Celestiais, Humanoides e Fadas.",
    expiry: "permanent",
    icon: "😈",
    color: "#8b0000",
    effects: {
      // Efeito é processado manualmente no cálculo de dano
    },
  },

  // =========================================================================
  // GIGANTE - Estatura Colossal
  // =========================================================================
  ESTATURA_COLOSSAL: {
    id: "ESTATURA_COLOSSAL",
    name: "Estatura Colossal",
    description: "Ocupa dobro do espaço e aumenta alcance em 1 quadrado.",
    expiry: "permanent",
    icon: "🗿",
    color: "#7f8c8d",
    effects: {
      // Efeito é processado manualmente no sistema de alcance
    },
  },

  // =========================================================================
  // HUMANOIDE - Vingança Final
  // =========================================================================
  VINGANCA_FINAL: {
    id: "VINGANCA_FINAL",
    name: "Vingança Final",
    description: "Pode atacar imediatamente ao ter Vitalidade zerada.",
    expiry: "permanent",
    icon: "⚔️",
    color: "#3498db",
    effects: {
      // Efeito é processado manualmente ao morrer
    },
  },

  // =========================================================================
  // MONSTRUOSIDADE - Sede de Sangue
  // =========================================================================
  SEDE_DE_SANGUE: {
    id: "SEDE_DE_SANGUE",
    name: "Sede de Sangue",
    description: "Ao matar, pode atacar novamente ou usar Corrida.",
    expiry: "permanent",
    icon: "👹",
    color: "#2c3e50",
    effects: {
      // Efeito é processado manualmente ao matar inimigo
    },
  },

  // =========================================================================
  // GOSMA - Aderência Ácida
  // =========================================================================
  ADERENCIA_ACIDA: {
    id: "ADERENCIA_ACIDA",
    name: "Aderência Ácida",
    description:
      "Unidades agarradas por Gosmas sofrem 2 de dano físico por turno.",
    expiry: "permanent",
    icon: "🟢",
    color: "#27ae60",
    effects: {
      // Efeito é processado manualmente quando agarra
    },
  },

  // Debuff aplicado em quem foi agarrado por Gosma
  AGARRADO_POR_GOSMA: {
    id: "AGARRADO_POR_GOSMA",
    name: "Agarrado por Gosma",
    description: "Preso em gosma ácida. Sofre 2 de dano físico por turno.",
    expiry: "manual",
    icon: "🟢",
    color: "#27ae60",
    effects: {
      blockMove: true,
      blockDash: true,
      damagePerTurn: 2,
    },
  },

  // =========================================================================
  // PLANTA - Raízes Profundas
  // =========================================================================
  RAIZES_PROFUNDAS: {
    id: "RAIZES_PROFUNDAS",
    name: "Raízes Profundas",
    description: "Em Batalhas Defensivas, todas as rolagens recebem +1D.",
    expiry: "permanent",
    icon: "🌿",
    color: "#2ecc71",
    effects: {
      // Efeito é processado manualmente em batalhas defensivas
    },
  },

  // =========================================================================
  // MORTO-VIVO - Drenar Vida
  // =========================================================================
  DRENAR_VIDA: {
    id: "DRENAR_VIDA",
    name: "Drenar Vida",
    description:
      "Ao render um inimigo, recupera 4 de Vitalidade imediatamente.",
    expiry: "permanent",
    icon: "🧟",
    color: "#1a1a2e",
    effects: {
      // Efeito é processado manualmente ao render inimigo
    },
  },

  // =========================================================================
  // INSETO - Colmeia Produtiva
  // =========================================================================
  COLMEIA_PRODUTIVA: {
    id: "COLMEIA_PRODUTIVA",
    name: "Colmeia Produtiva",
    description: "Produção Passiva de um Recurso escolhido aumenta em 2.",
    expiry: "permanent",
    icon: "🐝",
    color: "#d4ac0d",
    effects: {
      // Efeito é processado manualmente no sistema de economia
    },
  },
};
