// shared/types/conditions.types.ts
// Tipos compartilhados para o sistema de condições

/**
 * Efeitos que uma condição pode aplicar
 */
export interface ConditionEffects {
  // === BLOQUEIOS DE AÇÕES ===
  blockMove?: boolean;
  blockAttack?: boolean;
  blockDash?: boolean;
  blockDodge?: boolean;
  blockAllActions?: boolean;

  // === MODIFICADORES DE CHANCE ===
  dodgeChance?: number;
  critChance?: number;
  missChance?: number;

  // === MODIFICADORES DE DANO ===
  damageReduction?: number;
  damageReductionPercent?: number;
  bonusDamage?: number;
  bonusDamagePercent?: number;

  // === MODIFICADORES DE ATRIBUTOS ===
  combatMod?: number;
  acuityMod?: number;
  focusMod?: number;
  armorMod?: number;
  vitalityMod?: number;

  // === MODIFICADORES DE STATS DERIVADOS ===
  movementMod?: number;
  movementReduction?: number;
  movementMultiplier?: number;
  maxHpMod?: number;
  currentHpMod?: number;
  protectionMod?: number;
  actionsMod?: number;

  // === EFEITOS DE TURNO ===
  damagePerTurn?: number;
  healPerTurn?: number;

  // === EFEITOS ESPECIAIS ===
  immuneToConditions?: string[];
  reflectDamagePercent?: number;
  lifeStealPercent?: number;
  taunt?: boolean;
  invisible?: boolean;
  flying?: boolean;
  phasing?: boolean;
}

/**
 * Tipo de expiração de uma condição
 */
export type ConditionExpiry =
  | "end_of_turn"
  | "next_turn"
  | "on_action"
  | "on_damage"
  | "manual"
  | "permanent";

/**
 * Definição completa de uma condição
 */
export interface ConditionDefinition {
  id: string;
  name: string;
  description: string;
  expiry: ConditionExpiry;
  stackable?: boolean;
  maxStacks?: number;
  effects: ConditionEffects;
  icon?: string;
  color?: string;
}

/**
 * Informações visuais de uma condição para o frontend
 */
export interface ConditionInfo {
  icon: string;
  name: string;
  description: string;
  color: string;
}

/**
 * IDs de condições conhecidas
 */
export type ConditionId =
  | "GRAPPLED"
  | "DODGING"
  | "PROTECTED"
  | "STUNNED"
  | "FROZEN"
  | "BURNING"
  | "SLOWED"
  | "DISARMED"
  | "PRONE"
  | "FRIGHTENED"
  | "POISONED"
  | "BLEEDING"
  | "HELPED";
