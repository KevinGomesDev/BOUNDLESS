// shared/types/conditions.data.ts
// FONTE DE VERDADE para informações visuais de condições
// Este arquivo é usado pelo frontend e deve ser mantido em sincronia com server/logic/conditions.ts

import type { ConditionInfo } from "./conditions.types";

/**
 * Informações visuais de todas as condições
 * ATENÇÃO: Manter sincronizado com CONDITIONS em server/logic/conditions.ts
 */
export const CONDITIONS_INFO: Record<string, ConditionInfo> = {
  // =========================================================================
  // CONDIÇÕES DE COMBATE GERAIS
  // =========================================================================
  GRAPPLED: {
    icon: "🤼",
    name: "Agarrado",
    description: "A unidade não pode se mover enquanto estiver agarrada.",
    color: "#845ef7",
  },
  DODGING: {
    icon: "🌀",
    name: "Esquivando",
    description: "Postura defensiva. Ataques têm 50% de chance de errar.",
    color: "#60a5fa",
  },
  PROTECTED: {
    icon: "🛡️",
    name: "Protegido",
    description: "O próximo dano recebido é reduzido em 5 pontos.",
    color: "#60a5fa",
  },
  STUNNED: {
    icon: "💫",
    name: "Atordoado",
    description: "Movimentação reduzida em 2 células neste turno.",
    color: "#ffd43b",
  },
  FROZEN: {
    icon: "❄️",
    name: "Congelado",
    description: "A unidade não pode realizar nenhuma ação.",
    color: "#74c0fc",
  },
  BURNING: {
    icon: "🔥",
    name: "Queimando",
    description: "Recebe 3 de dano no início de cada turno.",
    color: "#ff6b35",
  },
  SLOWED: {
    icon: "🐌",
    name: "Lentidão",
    description: "Movimentação reduzida pela metade.",
    color: "#6b7280",
  },
  DISARMED: {
    icon: "🔓",
    name: "Desarmado",
    description: "Não pode atacar com armas.",
    color: "#f59e0b",
  },
  PRONE: {
    icon: "⬇️",
    name: "Caído",
    description: "Caído no chão, desvantagem em ataques.",
    color: "#ef4444",
  },
  FRIGHTENED: {
    icon: "😨",
    name: "Amedrontado",
    description: "Com medo, desvantagem em ataques.",
    color: "#fbbf24",
  },
  POISONED: {
    icon: "☠️",
    name: "Envenenado",
    description: "Recebe dano por turno que ignora proteção.",
    color: "#22c55e",
  },
  BLEEDING: {
    icon: "🩸",
    name: "Sangrando",
    description: "Perde HP gradualmente, aumenta com movimento.",
    color: "#dc2626",
  },
  HELPED: {
    icon: "🤝",
    name: "Ajudado",
    description: "Vantagem no próximo ataque.",
    color: "#22c55e",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - GUERREIRO
  // =========================================================================
  EXTRA_ATTACK: {
    icon: "⚔️",
    name: "Ataque Extra",
    description: "Pode realizar um ataque adicional ao usar a Ação de Ataque.",
    color: "#ef4444",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - BÁRBARO
  // =========================================================================
  WILD_FURY: {
    icon: "🔥",
    name: "Fúria Selvagem",
    description: "Dano recebido -1. Ataques têm mínimo 2 acertos.",
    color: "#dc2626",
  },
  RECKLESS_ATTACK: {
    icon: "💢",
    name: "Ataque Descuidado",
    description: "Pode atacar 2x quando usa Ação de Ataque, mas sem Proteção.",
    color: "#f97316",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - LADINO
  // =========================================================================
  SNEAK_ATTACK: {
    icon: "🗡️",
    name: "Ataque Furtivo",
    description: "+3 dano contra alvos que não te viram ou flanqueados.",
    color: "#7c3aed",
  },
  CUNNING_ACTION: {
    icon: "🎭",
    name: "Ação Ardilosa",
    description: "Dash, Disengage e Hide são ações bônus.",
    color: "#8b5cf6",
  },
  ASSASSINATE: {
    icon: "☠️",
    name: "Assassinar",
    description: "Primeiro ataque contra alvo que não agiu causa dano dobrado.",
    color: "#1f2937",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - PATRULHEIRO
  // =========================================================================
  NATURAL_EXPLORER: {
    icon: "🌲",
    name: "Explorador Natural",
    description: "+2 movimento em terrenos naturais. Ignora terreno difícil.",
    color: "#16a34a",
  },
  HUNTERS_MARK: {
    icon: "🎯",
    name: "Marca do Caçador",
    description: "Marcado pelo caçador. Ataques do marcador causam +2 dano.",
    color: "#dc2626",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - MAGO
  // =========================================================================
  ARCANE_MASTERY: {
    icon: "✨",
    name: "Maestria Arcana",
    description: "+1 em todos os testes de Foco.",
    color: "#6366f1",
  },
  SHIELDED: {
    icon: "🛡️",
    name: "Escudado",
    description: "Proteção mágica aumentada temporariamente.",
    color: "#3b82f6",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - CLÉRIGO
  // =========================================================================
  BLESSED: {
    icon: "✝️",
    name: "Abençoado",
    description: "+1 em todos os testes por 3 turnos.",
    color: "#eab308",
  },
  HELP_NEXT: {
    icon: "🤝",
    name: "Ajudado",
    description: "Próximo ataque tem vantagem.",
    color: "#22c55e",
  },

  // =========================================================================
  // CONDIÇÕES DE SKILLS - TROPAS
  // =========================================================================
  ESCUDO_PROTETOR: {
    icon: "🛡️",
    name: "Escudo Protetor",
    description: "Transfere 2 de dano de aliado adjacente para si.",
    color: "#3b82f6",
  },
  INVESTIDA: {
    icon: "🏇",
    name: "Investida",
    description: "+2 dano ao mover 2+ casas em linha reta antes de atacar.",
    color: "#f59e0b",
  },
  EMBOSCADA: {
    icon: "🎯",
    name: "Emboscada",
    description: "+3 dano contra unidades que não agiram este turno.",
    color: "#7c3aed",
  },
  FURTIVIDADE: {
    icon: "👤",
    name: "Furtividade",
    description:
      "Não pode ser alvo de ataques à distância se adjacente a aliado.",
    color: "#6b7280",
  },
  TIRO_RAPIDO: {
    icon: "🏹",
    name: "Tiro Rápido",
    description: "2 ataques à distância por turno, -1 dano cada.",
    color: "#10b981",
  },
};

/**
 * Obtém informação de uma condição
 * Retorna fallback se a condição não existir
 */
export function getConditionInfo(conditionId: string): ConditionInfo {
  return (
    CONDITIONS_INFO[conditionId] || {
      icon: "❓",
      name: conditionId,
      description: "Condição desconhecida",
      color: "#6b7280",
    }
  );
}
