// shared/data/Templates/SummonsTemplates.ts
// Templates raw de todas as invocações (summons) do jogo

/** Tipos de comportamento de IA para summons */
export type SummonAIBehavior =
  | "AGGRESSIVE"
  | "TACTICAL"
  | "DEFENSIVE"
  | "SUPPORT"
  | "RANGED";

export interface SummonTemplate {
  /** Código único da invocação */
  code: string;
  /** Nome da invocação */
  name: string;
  /** Descrição */
  description: string;
  /** Classe que invoca */
  summoner: string;
  /** Atributos base */
  combat: number;
  speed: number;
  focus: number;
  armor: number;
  vitality: number;
  /** Redução de dano fixa */
  damageReduction: number;
  /** Categoria da unidade (sempre SUMMON) */
  category: "SUMMON";
  /** Avatar (sprite) */
  avatar?: string;
  /** Ações disponíveis (códigos) - serão resolvidos depois */
  actionCodes?: string[];
  /** Skill passiva especial (se houver) */
  passiveCode?: string;
  /** Comportamento de IA (padrão: AGGRESSIVE) */
  aiBehavior?: SummonAIBehavior;
  /** Metadados extras (para lógicas específicas) */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// EIDOLON (Invocador)
// =============================================================================

/**
 * Eidolon - Invocação do Invocador
 *
 * - Começa fraco (3 em todos stats)
 * - Ganha +1 em TODOS atributos ao matar uma unidade (permanente na partida)
 * - Se morrer, perde todos os acúmulos e volta aos stats base
 */
export const EIDOLON: SummonTemplate = {
  code: "EIDOLON",
  name: "Eidolon",
  description:
    "Espírito guardião do Invocador. Fica mais forte a cada morte que causa, mas perde tudo se morrer.",
  summoner: "SUMMONER",
  combat: 3,
  speed: 3,
  focus: 3,
  armor: 3,
  vitality: 3,
  damageReduction: 0,
  category: "SUMMON",
  avatar: undefined, // TODO: Definir sprite
  actionCodes: ["ATTACK", "DASH", "DODGE"], // Códigos das ações comuns
  passiveCode: "EIDOLON_GROWTH", // Skill de crescimento ao matar
  aiBehavior: "AGGRESSIVE", // Ataca diretamente sem avaliar perigo
  metadata: {
    // Acúmulos são armazenados no estado da partida, não aqui
    growthPerKill: 1, // +1 em todos atributos por kill
    resetsOnDeath: true, // Perde acúmulos se morrer
  },
};
