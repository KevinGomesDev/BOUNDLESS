/**
 * Constantes da Arena - Centralizadas para fácil manutenção
 */

// Re-exportar CONDITIONS_INFO do shared (fonte de verdade)
export {
  CONDITIONS_INFO,
  getConditionInfo,
} from "../../../../../shared/types/conditions.data";

/**
 * Informações sobre ações disponíveis
 */
export const ACTIONS_INFO: Record<
  string,
  { icon: string; name: string; description: string; color: string }
> = {
  MOVE: {
    icon: "🚶",
    name: "Mover",
    description: "Move a unidade pelo campo de batalha",
    color: "#3b82f6",
  },
  ATTACK: {
    icon: "⚔️",
    name: "Atacar",
    description: "Ataca um inimigo adjacente",
    color: "#ef4444",
  },
  DASH: {
    icon: "🏃",
    name: "Correr",
    description: "Move o dobro da distância normal",
    color: "#22c55e",
  },
  DODGE: {
    icon: "💨",
    name: "Esquivar",
    description: "Ganha +2 de AC até o próximo turno",
    color: "#64748b",
  },
  HELP: {
    icon: "🤝",
    name: "Ajudar",
    description: "Dá vantagem a um aliado adjacente",
    color: "#8b5cf6",
  },
  PROTECT: {
    icon: "🛡️",
    name: "Proteger",
    description: "Protege um aliado adjacente",
    color: "#3b82f6",
  },
  KNOCKDOWN: {
    icon: "⬇️",
    name: "Derrubar",
    description: "Tenta derrubar o inimigo",
    color: "#f59e0b",
  },
  DISARM: {
    icon: "🔓",
    name: "Desarmar",
    description: "Tenta desarmar o inimigo",
    color: "#f59e0b",
  },
  GRAB: {
    icon: "✊",
    name: "Agarrar",
    description: "Agarra um inimigo adjacente",
    color: "#8b5cf6",
  },
  THROW: {
    icon: "🪨",
    name: "Arremessar",
    description: "Arremessa um inimigo agarrado",
    color: "#f59e0b",
  },
  FLEE: {
    icon: "🏃‍♂️",
    name: "Fugir",
    description: "Tenta escapar de uma agarrada",
    color: "#64748b",
  },
  CAST: {
    icon: "✨",
    name: "Lançar",
    description: "Usa uma habilidade mágica",
    color: "#a855f7",
  },
  END_TURN: {
    icon: "⏭️",
    name: "Passar",
    description: "Termina o turno sem agir",
    color: "#6b7280",
  },
  SURRENDER: {
    icon: "🏳️",
    name: "Render",
    description: "Desiste da batalha",
    color: "#dc2626",
  },
};

/**
 * Tooltips para atributos
 */
export const ATTRIBUTE_TOOLTIPS: Record<string, string> = {
  combat: "Bônus de ataque corpo-a-corpo",
  speed: "Velocidade - determina chance de esquiva e ordem de turno",
  focus: "Bônus para habilidades mágicas",
  armor: "Redução de dano recebido",
  vitality: "Pontos de vida máximos = Vitality × 2",
  protection: "Escudo temporário, absorve dano antes do HP",
  initiative: "Ordem de ação na batalha (maior = primeiro)",
  damageReduction: "Redução fixa de dano por ataque",
};

/**
 * Cores padrão para UI
 */
export const UI_COLORS = {
  // Player colors
  host: "#3b82f6", // blue-500
  guest: "#ef4444", // red-500
  ally: "#22c55e", // green-500
  enemy: "#ef4444", // red-500
  neutral: "#6b7280", // gray-500

  // Health bar
  healthHigh: "#22c55e", // green-500
  healthMedium: "#eab308", // yellow-500
  healthLow: "#ef4444", // red-500
  healthCritical: "#7f1d1d", // red-900

  // Protection
  protection: "#3b82f6", // blue-500
  protectionBroken: "#6b7280", // gray-500

  // Grid
  gridDefault: "#1f2937", // gray-800
  gridHighlight: "#374151", // gray-700
  gridSelected: "#2563eb", // blue-600
  gridMovable: "#22c55e40", // green-500/40
  gridAttackable: "#ef444440", // red-500/40

  // Timer
  timerNormal: "#22c55e", // green-500
  timerWarning: "#eab308", // yellow-500
  timerCritical: "#ef4444", // red-500
};

/**
 * Thresholds para timer
 */
export const TIMER_THRESHOLDS = {
  warning: 15, // segundos
  critical: 5, // segundos
};

/**
 * Categorias de unidades
 */
export const UNIT_CATEGORIES = {
  REGENT: { name: "Regente", icon: "👑", color: "#fbbf24" },
  TROOP: { name: "Tropa", icon: "⚔️", color: "#64748b" },
  HERO: { name: "Herói", icon: "🦸", color: "#8b5cf6" },
  MONSTER: { name: "Monstro", icon: "👹", color: "#ef4444" },
};
