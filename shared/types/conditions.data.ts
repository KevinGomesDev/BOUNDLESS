// shared/types/conditions.data.ts
// FONTE DE VERDADE para informações visuais de condições
// Este arquivo é usado pelo frontend e deve ser mantido em sincronia com server/logic/conditions.ts

import type { ConditionInfo } from "./conditions.types";

/**
 * Informações visuais de todas as condições
 * ATENÇÃO: Manter sincronizado com CONDITIONS em server/logic/conditions.ts
 */
export const CONDITIONS_INFO: Record<string, ConditionInfo> = {
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
