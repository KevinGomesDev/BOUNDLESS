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

  // =========================================================================
  // CONDIÇÕES DE RAÇA
  // =========================================================================
  PELE_AMORFA: {
    icon: "🫠",
    name: "Pele Amorfa",
    description: "Reduz todos os tipos de danos recebidos em 1.",
    color: "#8e44ad",
  },
  FURIA_DA_MATILHA: {
    icon: "🐺",
    name: "Fúria da Matilha",
    description:
      "Quando aliado Besta morre, todas as Bestas aliadas ganham +1D na próxima rolagem.",
    color: "#8b4513",
  },
  FURIA_DA_MATILHA_ATIVA: {
    icon: "🐺",
    name: "Fúria da Matilha (Ativa)",
    description: "+1D na próxima rolagem (aliado Besta morreu).",
    color: "#c0392b",
  },
  LUZ_SAGRADA: {
    icon: "✨",
    name: "Luz Sagrada",
    description:
      "Causa o dobro de dano em Diabos, Monstruosidades e Mortos-Vivos.",
    color: "#ffd700",
  },
  PESO_DE_FERRO: {
    icon: "🤖",
    name: "Peso de Ferro",
    description: "Não pode ser arremessado, agarrado ou derrubado.",
    color: "#95a5a6",
  },
  SANGUE_ARCANO: {
    icon: "🐉",
    name: "Sangue Arcano",
    description: "Reduz o custo de Arcana para Magias em 2.",
    color: "#c0392b",
  },
  AFINIDADE_ELEMENTAL: {
    icon: "🌊",
    name: "Afinidade Elemental",
    description: "Imune a um elemento, vulnerável a outro.",
    color: "#e67e22",
  },
  GRACA_FEERICA: {
    icon: "🧚",
    name: "Graça Feérica",
    description: "Imune a efeitos negativos de Climas.",
    color: "#9b59b6",
  },
  CHAMAS_DO_INFERNO: {
    icon: "😈",
    name: "Chamas do Inferno",
    description: "Causa o dobro de dano em Celestiais, Humanoides e Fadas.",
    color: "#8b0000",
  },
  ESTATURA_COLOSSAL: {
    icon: "🗿",
    name: "Estatura Colossal",
    description: "Ocupa dobro do espaço e aumenta alcance em 1 quadrado.",
    color: "#7f8c8d",
  },
  VINGANCA_FINAL: {
    icon: "⚔️",
    name: "Vingança Final",
    description: "Pode atacar imediatamente ao ter Vitalidade zerada.",
    color: "#3498db",
  },
  SEDE_DE_SANGUE: {
    icon: "👹",
    name: "Sede de Sangue",
    description: "Ao matar, pode atacar novamente ou usar Corrida.",
    color: "#2c3e50",
  },
  ADERENCIA_ACIDA: {
    icon: "🟢",
    name: "Aderência Ácida",
    description: "Unidades agarradas sofrem 2 de dano físico por turno.",
    color: "#27ae60",
  },
  AGARRADO_POR_GOSMA: {
    icon: "🟢",
    name: "Agarrado por Gosma",
    description: "Preso em gosma ácida. Sofre 2 de dano físico por turno.",
    color: "#27ae60",
  },
  RAIZES_PROFUNDAS: {
    icon: "🌿",
    name: "Raízes Profundas",
    description: "Em Batalhas Defensivas, +1D em todas as rolagens.",
    color: "#2ecc71",
  },
  DRENAR_VIDA: {
    icon: "🧟",
    name: "Drenar Vida",
    description: "Ao render um inimigo, recupera 4 de Vitalidade.",
    color: "#1a1a2e",
  },
  COLMEIA_PRODUTIVA: {
    icon: "🐝",
    name: "Colmeia Produtiva",
    description: "Produção Passiva de um Recurso escolhido aumenta em 2.",
    color: "#d4ac0d",
  },

  // =========================================================================
  // CONDIÇÕES DE SPELLS
  // =========================================================================
  EMPOWERED: {
    icon: "⚡",
    name: "Potencializado",
    description:
      "Todos os atributos aumentados temporariamente. Será seguido por Exaustão.",
    color: "#fbbf24",
  },
  EXHAUSTED: {
    icon: "💤",
    name: "Exausto",
    description:
      "Penalidade em todos os atributos após o efeito de Potencializar.",
    color: "#6b7280",
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
