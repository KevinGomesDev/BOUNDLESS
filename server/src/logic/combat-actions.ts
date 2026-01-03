import {
  validateGridMove,
  applyDualProtectionDamage,
} from "../utils/battle.utils";
import {
  scanConditionsForAction,
  applyConditionScanResult,
  getExtraAttacksFromConditions,
} from "./conditions";
import {
  getManhattanDistance,
  isAdjacent,
  isAdjacentOmnidirectional,
  getAdjacentPositions,
} from "../../../shared/types/skills.types";
import type { BattleObstacle } from "../../../shared/types/battle.types";
import {
  OBSTACLE_CONFIG,
  DEFENSE_CONFIG,
} from "../../../shared/config/global.config";
import {
  calculatePhysicalProtection,
  calculateMagicalProtection,
} from "./dice-system";

export interface CombatUnit {
  id: string;
  ownerId: string;
  ownerKingdomId: string;
  name: string;
  category: string;
  combat: number;
  speed: number; // Movement = floor(speed / 2), minimum 1
  focus: number;
  armor: number;
  vitality: number;
  damageReduction: number; // Fixed DR, most units have 0
  currentHp: number;
  posX: number;
  posY: number;
  movesLeft: number;
  actionsLeft: number;
  attacksLeftThisTurn: number; // Ataques restantes neste turno (para extraAttacks)
  isAlive: boolean;
  // Proteção Física - ver shared/config/balance.config.ts
  physicalProtection: number;
  maxPhysicalProtection: number;
  // Proteção Mágica - ver shared/config/balance.config.ts
  magicalProtection: number;
  maxMagicalProtection: number;
  conditions: string[];
  actions: string[];
}

export interface MoveActionResult {
  success: boolean;
  error?: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  movesLeft?: number;
  moveCost?: number;
}

export interface AttackActionResult {
  success: boolean;
  error?: string;
  missed?: boolean; // True se o ataque foi esquivado
  dodged?: boolean; // True se o alvo esquivou (sinônimo de missed)
  targetType?: "unit" | "corpse" | "obstacle";
  rawDamage?: number;
  damageReduction?: number;
  finalDamage?: number;
  damageType?: string;
  targetHpAfter?: number;
  targetPhysicalProtection?: number;
  targetMagicalProtection?: number;
  targetDefeated?: boolean;
  obstacleDestroyed?: boolean;
  obstacleId?: string;
  attacksLeftThisTurn?: number; // Ataques restantes após este
  dodgeChance?: number; // % de chance de esquiva
  dodgeRoll?: number; // Rolagem de 1-100
}

export interface DashActionResult {
  success: boolean;
  error?: string;
  newMovesLeft?: number;
}

export interface DodgeActionResult {
  success: boolean;
  error?: string;
}

// Calcula movimento base: retorna Velocidade completa (mínimo 1)
export function calculateBaseMovement(speed: number): number {
  return Math.max(1, speed);
}

export function executeMoveAction(
  unit: CombatUnit,
  toX: number,
  toY: number,
  gridWidth: number,
  gridHeight: number,
  allUnits: CombatUnit[],
  obstacles: BattleObstacle[] = []
): MoveActionResult {
  if (!unit.actions.includes("move")) {
    return { success: false, error: "Unit cannot move" };
  }
  if (!unit.isAlive) {
    return { success: false, error: "Dead unit cannot move" };
  }

  // Varredura de condições
  const scan = scanConditionsForAction(unit.conditions, "move");
  if (!scan.canPerform) {
    return { success: false, error: scan.blockReason };
  }

  const moveValidation = validateGridMove(
    unit.posX,
    unit.posY,
    toX,
    toY,
    gridWidth,
    gridHeight,
    unit.movesLeft
  );

  if (!moveValidation.valid) {
    return { success: false, error: moveValidation.reason };
  }

  // Verificar se há unidade viva ocupando a célula
  const isOccupied = allUnits.some(
    (u) => u.posX === toX && u.posY === toY && u.isAlive && u.id !== unit.id
  );

  if (isOccupied) {
    return { success: false, error: "Target cell is occupied" };
  }

  // Verificar se há cadáver bloqueando (se configurado para bloquear)
  const hasCorpse = allUnits.some(
    (u) =>
      u.posX === toX &&
      u.posY === toY &&
      !u.isAlive &&
      !u.conditions.includes("CORPSE_REMOVED")
  );

  if (hasCorpse) {
    return { success: false, error: "Target cell is blocked by corpse" };
  }

  // Verificar se há obstáculo bloqueando (não destruído)
  const hasObstacle = obstacles.some(
    (obs) => obs.posX === toX && obs.posY === toY && !obs.destroyed
  );

  if (hasObstacle) {
    return { success: false, error: "Target cell is blocked by obstacle" };
  }

  const fromX = unit.posX;
  const fromY = unit.posY;

  unit.posX = toX;
  unit.posY = toY;
  unit.movesLeft -= moveValidation.cost;

  // Aplicar expiração de condições
  unit.conditions = applyConditionScanResult(unit.conditions, scan);

  return {
    success: true,
    fromX,
    fromY,
    toX,
    toY,
    movesLeft: unit.movesLeft,
    moveCost: moveValidation.cost,
  };
}

/**
 * Parâmetros de ataque unificados
 * Pode atacar: unidade viva, cadáver (unidade morta) ou obstáculo
 */
export interface AttackParams {
  attacker: CombatUnit;
  // Alvo: unidade (viva ou morta)
  targetUnit?: CombatUnit;
  // Alvo: obstáculo (posição)
  targetObstacle?: BattleObstacle;
  // Tipo de dano
  damageType?: string;
}

/**
 * Executa ataque unificado: unidade, cadáver ou obstáculo
 * NOVO SISTEMA SEM DADOS:
 * - Dano = Combat × Multiplicador (do ATTACK_CONFIG)
 * - Esquiva = 1D100 vs Speed × dodgeMultiplier (máximo maxDodgeChance)
 */
export function executeAttackAction(
  attacker: CombatUnit,
  target: CombatUnit | null,
  damageType: string = "FISICO",
  obstacle?: BattleObstacle
): AttackActionResult {
  if (!attacker.actions.includes("attack")) {
    return { success: false, error: "Unit cannot attack" };
  }
  if (!attacker.isAlive) {
    return { success: false, error: "Dead unit cannot attack" };
  }

  // === SISTEMA DE MÚLTIPLOS ATAQUES (extraAttacks) ===
  const hasAttacksRemaining = attacker.attacksLeftThisTurn > 0;

  if (!hasAttacksRemaining) {
    if (attacker.actionsLeft <= 0) {
      return { success: false, error: "No actions left this turn" };
    }
  }

  // Varredura de condições do atacante
  const attackerScan = scanConditionsForAction(attacker.conditions, "attack");
  if (!attackerScan.canPerform) {
    return { success: false, error: attackerScan.blockReason };
  }

  // Determinar tipo de alvo e posição
  let targetX: number;
  let targetY: number;
  let targetType: "unit" | "corpse" | "obstacle";

  if (obstacle) {
    targetX = obstacle.posX;
    targetY = obstacle.posY;
    targetType = "obstacle";
  } else if (target) {
    targetX = target.posX;
    targetY = target.posY;
    targetType = target.isAlive ? "unit" : "corpse";
  } else {
    return { success: false, error: "No target specified" };
  }

  // Verificar adjacência omnidirecional (8 direções incluindo diagonais)
  if (
    !isAdjacentOmnidirectional(attacker.posX, attacker.posY, targetX, targetY)
  ) {
    return { success: false, error: "Target must be adjacent" };
  }

  // === CONSUMO DE AÇÃO E ATAQUES EXTRAS ===
  if (!hasAttacksRemaining) {
    attacker.actionsLeft = Math.max(0, attacker.actionsLeft - 1);
    const hasProtection = attacker.physicalProtection > 0;
    const extraAttacks = getExtraAttacksFromConditions(
      attacker.conditions,
      hasProtection
    );
    attacker.attacksLeftThisTurn = extraAttacks;
  } else {
    attacker.attacksLeftThisTurn = Math.max(
      0,
      attacker.attacksLeftThisTurn - 1
    );
  }

  // === CÁLCULO DE DANO (SEM DADOS) ===
  // Dano = Combat × Multiplicador + bônus de condições
  const bonusDamage = attackerScan.modifiers.bonusDamage || 0;
  const rawDamage = Math.max(1, attacker.combat) + bonusDamage;

  // === LÓGICA ESPECÍFICA POR TIPO DE ALVO ===

  if (targetType === "obstacle" && obstacle) {
    const obstacleHp = obstacle.hp ?? OBSTACLE_CONFIG.defaultHp;
    const newHp = Math.max(0, obstacleHp - rawDamage);
    const destroyed = newHp <= 0;

    obstacle.hp = newHp;
    obstacle.destroyed = destroyed;

    attacker.conditions = applyConditionScanResult(
      attacker.conditions,
      attackerScan
    );

    return {
      success: true,
      targetType: "obstacle",
      rawDamage,
      damageReduction: 0,
      finalDamage: rawDamage,
      damageType,
      targetHpAfter: newHp,
      obstacleDestroyed: destroyed,
      obstacleId: obstacle.id,
      targetDefeated: destroyed,
      attacksLeftThisTurn: attacker.attacksLeftThisTurn,
    };
  }

  if (targetType === "corpse" && target) {
    const corpseHp = OBSTACLE_CONFIG.corpseHp;
    const destroyed = rawDamage >= corpseHp;

    if (destroyed && !target.conditions.includes("CORPSE_REMOVED")) {
      target.conditions.push("CORPSE_REMOVED");
    }

    attacker.conditions = applyConditionScanResult(
      attacker.conditions,
      attackerScan
    );

    return {
      success: true,
      targetType: "corpse",
      rawDamage,
      damageReduction: 0,
      finalDamage: rawDamage,
      damageType,
      targetHpAfter: 0,
      targetDefeated: destroyed,
      attacksLeftThisTurn: attacker.attacksLeftThisTurn,
    };
  }

  // === ATACANDO UNIDADE VIVA ===
  if (!target || !target.isAlive) {
    return { success: false, error: "Target unit is not alive" };
  }

  // Varredura de condições do alvo
  const targetScan = scanConditionsForAction(target.conditions, "attack");

  // === SISTEMA DE ESQUIVA (1D100) ===
  // Chance = Speed × dodgeMultiplier + bônus de condições (cap: maxDodgeChance)
  const baseDodgeChance =
    target.speed * DEFENSE_CONFIG.dodgeMultiplier +
    (targetScan.modifiers.dodgeChance || 0);
  const dodgeChance = Math.min(baseDodgeChance, DEFENSE_CONFIG.maxDodgeChance);
  const dodgeRoll = Math.floor(Math.random() * 100) + 1; // 1-100

  if (dodgeRoll <= dodgeChance) {
    // Alvo esquivou!
    attacker.conditions = applyConditionScanResult(
      attacker.conditions,
      attackerScan
    );
    return {
      success: true,
      missed: true,
      dodged: true,
      targetType: "unit",
      rawDamage: 0,
      damageReduction: 0,
      finalDamage: 0,
      damageType,
      targetHpAfter: target.currentHp,
      targetPhysicalProtection: target.physicalProtection,
      targetMagicalProtection: target.magicalProtection,
      targetDefeated: false,
      attacksLeftThisTurn: attacker.attacksLeftThisTurn,
      dodgeChance,
      dodgeRoll,
    };
  }

  // === APLICAR DANO ===
  // Redução de dano apenas por condições (não mais por dados)
  const damageReduction = targetScan.modifiers.damageReduction || 0;
  const damageToApply = Math.max(0, rawDamage - damageReduction);

  console.log("[COMBAT] Aplicando dano (novo sistema):", {
    rawDamage,
    damageReduction,
    damageToApply,
    damageType,
    dodgeChance,
    dodgeRoll,
  });

  // Aplicar dano na proteção apropriada
  const protectionResult = applyDualProtectionDamage(
    target.physicalProtection,
    target.magicalProtection,
    target.currentHp,
    damageToApply,
    damageType
  );

  target.physicalProtection = protectionResult.newPhysicalProtection;
  target.magicalProtection = protectionResult.newMagicalProtection;
  target.currentHp = protectionResult.newHp;

  // Aplicar expiração de condições
  attacker.conditions = applyConditionScanResult(
    attacker.conditions,
    attackerScan
  );
  target.conditions = applyConditionScanResult(target.conditions, targetScan);

  let targetDefeated = false;
  if (target.currentHp <= 0) {
    targetDefeated = true;
    target.isAlive = false;
  }

  return {
    success: true,
    targetType: "unit",
    rawDamage,
    damageReduction,
    finalDamage: damageToApply,
    damageType,
    targetHpAfter: target.currentHp,
    targetPhysicalProtection: target.physicalProtection,
    targetMagicalProtection: target.magicalProtection,
    targetDefeated,
    attacksLeftThisTurn: attacker.attacksLeftThisTurn,
    dodgeChance,
    dodgeRoll,
  };
}

export function executeDashAction(unit: CombatUnit): DashActionResult {
  if (!unit.actions.includes("dash")) {
    return { success: false, error: "Unit cannot dash" };
  }
  if (!unit.isAlive) {
    return { success: false, error: "Dead unit cannot dash" };
  }

  const scan = scanConditionsForAction(unit.conditions, "dash");
  if (!scan.canPerform) {
    return { success: false, error: scan.blockReason };
  }

  if (unit.actionsLeft <= 0) {
    return { success: false, error: "No actions left this turn" };
  }

  unit.actionsLeft = Math.max(0, unit.actionsLeft - 1);
  // SOMA movimentos extras ao invés de resetar
  unit.movesLeft = unit.movesLeft + calculateBaseMovement(unit.speed);
  unit.conditions = applyConditionScanResult(unit.conditions, scan);

  return {
    success: true,
    newMovesLeft: unit.movesLeft,
  };
}

export function executeDodgeAction(unit: CombatUnit): DodgeActionResult {
  if (!unit.actions.includes("dodge")) {
    return { success: false, error: "Unit cannot dodge" };
  }
  if (!unit.isAlive) {
    return { success: false, error: "Dead unit cannot dodge" };
  }

  const scan = scanConditionsForAction(unit.conditions, "dodge");
  if (!scan.canPerform) {
    return { success: false, error: scan.blockReason };
  }

  if (unit.actionsLeft <= 0) {
    return { success: false, error: "No actions left this turn" };
  }

  unit.actionsLeft = Math.max(0, unit.actionsLeft - 1);
  unit.conditions = applyConditionScanResult(unit.conditions, scan);

  if (!unit.conditions.includes("DODGING")) {
    unit.conditions.push("DODGING");
  }

  return { success: true };
}

export const COMBAT_ACTIONS = {
  move: {
    id: "move",
    name: "Move",
    costType: "movement",
  },
  attack: {
    id: "attack",
    name: "Attack",
    costType: "action",
  },
  dash: {
    id: "dash",
    name: "Dash",
    costType: "action",
  },
  dodge: {
    id: "dodge",
    name: "Dodge",
    costType: "action",
  },
} as const;

export { DEFAULT_UNIT_ACTIONS } from "./unit-actions";

export function canUnitPerformAction(
  unit: CombatUnit,
  actionId: string
): boolean {
  if (!unit.actions.includes(actionId) || !unit.isAlive) return false;
  const scan = scanConditionsForAction(unit.conditions, actionId);
  return scan.canPerform;
}

export function getAvailableActions(unit: CombatUnit): string[] {
  if (!unit.isAlive) return [];

  const available: string[] = [];

  for (const actionId of unit.actions) {
    const scan = scanConditionsForAction(unit.conditions, actionId);
    if (!scan.canPerform) continue;

    // Verificar recursos necessários
    if (actionId === "move" && unit.movesLeft <= 0) continue;
    if (["attack", "dash", "dodge"].includes(actionId) && unit.actionsLeft <= 0)
      continue;

    available.push(actionId);
  }

  return available;
}

// =====================
// Ações Avançadas de Combate
// =====================

export interface ContestedRollResult {
  success: boolean;
  error?: string;
  // Campos legados (opcionais para compatibilidade)
  attackerRolls?: number[];
  defenderRolls?: number[];
  attackerSuccesses?: number;
  defenderSuccesses?: number;
  // Novos campos para sistema sem dados
  attackerRoll?: number;
  attackerChance?: number;
  defenderRoll?: number;
  defenderChance?: number;
}

export interface HelpActionResult {
  success: boolean;
  error?: string;
}

export interface ProtectActionResult {
  success: boolean;
  error?: string;
  alreadyUsed?: boolean;
}

export interface ThrowActionResult {
  success: boolean;
  error?: string;
  finalX?: number;
  finalY?: number;
  collided?: boolean;
  attackerDamage?: number;
  targetDamage?: number;
}

export interface GrabActionResult extends ContestedRollResult {
  grabbed?: boolean;
}

export interface FleeActionResult extends ContestedRollResult {
  fled?: boolean;
}

export interface CastActionResult {
  success: boolean;
  error?: string;
  rolls?: number[];
  successes?: number;
  threshold?: number;
}

export interface AttackObstacleResult {
  success: boolean;
  error?: string;
  damage?: number;
  destroyed?: boolean;
}

// Ajuda: aplica HELP_NEXT na unidade adjacente (reduz CD em 1 na próxima ação)
export function executeHelpAction(
  helper: CombatUnit,
  target: CombatUnit
): HelpActionResult {
  if (!helper.isAlive) {
    return { success: false, error: "Unidade morta não pode ajudar" };
  }
  if (!target.isAlive) {
    return { success: false, error: "Não pode ajudar unidade morta" };
  }

  if (!isAdjacent(helper.posX, helper.posY, target.posX, target.posY)) {
    return { success: false, error: "Alvo deve estar adjacente" };
  }

  if (!target.conditions.includes("HELP_NEXT")) {
    target.conditions.push("HELP_NEXT");
  }

  return { success: true };
}

// Proteger-se: reduz próximo dano em 5; uma vez por batalha
export function executeProtectAction(unit: CombatUnit): ProtectActionResult {
  if (!unit.isAlive) {
    return { success: false, error: "Unidade morta não pode se proteger" };
  }

  if (unit.conditions.includes("PROTECT_USED")) {
    return {
      success: false,
      error: "Já usou Proteger-se nesta batalha",
      alreadyUsed: true,
    };
  }

  if (!unit.conditions.includes("PROTECTED")) {
    unit.conditions.push("PROTECTED");
  }
  unit.conditions.push("PROTECT_USED");

  return { success: true };
}

// =============================================================================
// AÇÕES ESPECIAIS - SISTEMA SEM DADOS
// =============================================================================
// Usam teste de 1D100 vs atributo × modificador

/**
 * Resultado de teste resistido simplificado
 */
export interface SimpleContestedResult {
  success: boolean;
  error?: string;
  attackerRoll?: number; // 1-100
  attackerChance?: number; // % de sucesso
  defenderRoll?: number; // 1-100
  defenderChance?: number; // % de resistência
}

/**
 * Executa um teste resistido simplificado (Combat vs Speed)
 * Atacante precisa rolar acima de: 50 - (Combat × 5) + (targetSpeed × 3)
 * Resultado: 1D100 < (Combat × 5) - (targetSpeed × 3) + 50
 */
function simpleContestedCheck(
  attackerCombat: number,
  targetSpeed: number
): { success: boolean; roll: number; chance: number } {
  // Chance = 50 + (Combat × 5) - (Speed × 3), clamped 5-95
  const chance = Math.min(
    95,
    Math.max(5, 50 + attackerCombat * 5 - targetSpeed * 3)
  );
  const roll = Math.floor(Math.random() * 100) + 1;
  return { success: roll <= chance, roll, chance };
}

// Derrubar: teste Combat vs Speed; aplica DERRUBADA
export function executeKnockdownAction(
  attacker: CombatUnit,
  target: CombatUnit
): SimpleContestedResult {
  if (!attacker.isAlive) {
    return { success: false, error: "Unidade morta não pode derrubar" };
  }
  if (!target.isAlive) {
    return { success: false, error: "Não pode derrubar unidade morta" };
  }

  if (!isAdjacent(attacker.posX, attacker.posY, target.posX, target.posY)) {
    return { success: false, error: "Alvo deve estar adjacente" };
  }

  const result = simpleContestedCheck(attacker.combat, target.speed);

  if (result.success && !target.conditions.includes("DERRUBADA")) {
    target.conditions.push("DERRUBADA");
  }

  return {
    success: result.success,
    attackerRoll: result.roll,
    attackerChance: result.chance,
  };
}

// Desarmar: teste Combat vs Speed; aplica DISARMED
export function executeDisarmAction(
  attacker: CombatUnit,
  target: CombatUnit
): SimpleContestedResult {
  if (!attacker.isAlive) {
    return { success: false, error: "Unidade morta não pode desarmar" };
  }
  if (!target.isAlive) {
    return { success: false, error: "Não pode desarmar unidade morta" };
  }

  if (!isAdjacent(attacker.posX, attacker.posY, target.posX, target.posY)) {
    return { success: false, error: "Alvo deve estar adjacente" };
  }

  const result = simpleContestedCheck(attacker.combat, target.speed);

  if (result.success && !target.conditions.includes("DISARMED")) {
    target.conditions.push("DISARMED");
  }

  return {
    success: result.success,
    attackerRoll: result.roll,
    attackerChance: result.chance,
  };
}

// Agarrar: teste Combat vs Speed; ambos ficam AGARRADO
export function executeGrabAction(
  attacker: CombatUnit,
  target: CombatUnit
): GrabActionResult {
  if (!attacker.isAlive) {
    return { success: false, error: "Unidade morta não pode agarrar" };
  }
  if (!target.isAlive) {
    return { success: false, error: "Não pode agarrar unidade morta" };
  }

  if (!isAdjacent(attacker.posX, attacker.posY, target.posX, target.posY)) {
    return { success: false, error: "Alvo deve estar adjacente" };
  }

  const result = simpleContestedCheck(attacker.combat, target.speed);

  if (result.success) {
    if (!attacker.conditions.includes("AGARRADO")) {
      attacker.conditions.push("AGARRADO");
    }
    if (!target.conditions.includes("AGARRADO")) {
      target.conditions.push("AGARRADO");
    }
  }

  return {
    success: true,
    grabbed: result.success,
  };
}

// Arremessar: usa Combat para determinar distância, dano fixo
export function executeThrowAction(
  attacker: CombatUnit,
  target: CombatUnit,
  dirX: number,
  dirY: number,
  gridWidth: number,
  gridHeight: number,
  allUnits: CombatUnit[]
): ThrowActionResult {
  if (!attacker.isAlive) {
    return { success: false, error: "Unidade morta não pode arremessar" };
  }
  if (!target.isAlive) {
    return { success: false, error: "Não pode arremessar unidade morta" };
  }

  if (!isAdjacent(attacker.posX, attacker.posY, target.posX, target.posY)) {
    return { success: false, error: "Alvo deve estar adjacente" };
  }

  const dx = Math.sign(dirX || 0);
  const dy = Math.sign(dirY || 0);
  if (dx === 0 && dy === 0) {
    return { success: false, error: "Direção inválida" };
  }

  // Distância = Combat (mínimo 1, máximo 5)
  const distance = Math.min(5, Math.max(1, attacker.combat));
  let steps = distance;
  let finalX = target.posX;
  let finalY = target.posY;
  let collided = false;

  while (steps > 0) {
    const nx = finalX + dx;
    const ny = finalY + dy;

    if (nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight) {
      collided = true;
      break;
    }

    const unitAt = allUnits.find(
      (u) => u.posX === nx && u.posY === ny && u.id !== target.id
    );
    if (
      unitAt &&
      (unitAt.isAlive || !unitAt.conditions.includes("CORPSE_REMOVED"))
    ) {
      collided = true;
      break;
    }

    finalX = nx;
    finalY = ny;
    steps--;
  }

  target.posX = finalX;
  target.posY = finalY;

  // Dano = Combat do atacante
  const damage = attacker.combat;
  let attackerDamage = 0;
  let targetDamage = 0;

  if (damage > 0) {
    const attackerResult = applyDualProtectionDamage(
      attacker.physicalProtection,
      attacker.magicalProtection,
      attacker.currentHp,
      damage,
      "FISICO"
    );
    attacker.physicalProtection = attackerResult.newPhysicalProtection;
    attacker.magicalProtection = attackerResult.newMagicalProtection;
    attacker.currentHp = attackerResult.newHp;
    attackerDamage = damage;

    const targetResult = applyDualProtectionDamage(
      target.physicalProtection,
      target.magicalProtection,
      target.currentHp,
      damage,
      "FISICO"
    );
    target.physicalProtection = targetResult.newPhysicalProtection;
    target.magicalProtection = targetResult.newMagicalProtection;
    target.currentHp = targetResult.newHp;
    targetDamage = damage;

    if (attacker.currentHp <= 0) attacker.isAlive = false;
    if (target.currentHp <= 0) target.isAlive = false;
  }

  return {
    success: true,
    finalX,
    finalY,
    collided,
    attackerDamage,
    targetDamage,
  };
}

// Fuga: teste de Speed vs Speed do inimigo
export function executeFleeAction(
  unit: CombatUnit,
  nearestEnemy: CombatUnit
): FleeActionResult {
  if (!unit.isAlive) {
    return { success: false, error: "Unidade morta não pode fugir" };
  }

  // Chance = 50 + (mySpeed × 5) - (enemySpeed × 3)
  const chance = Math.min(
    95,
    Math.max(5, 50 + unit.speed * 5 - nearestEnemy.speed * 3)
  );
  const roll = Math.floor(Math.random() * 100) + 1;
  const fled = roll <= chance;

  return {
    success: true,
    fled,
  };
}

// Conjurar: sucesso baseado em Focus (sempre funciona, Focus determina potência)
export function executeCastAction(
  unit: CombatUnit,
  spellId: string
): CastActionResult {
  if (!unit.isAlive) {
    return { success: false, error: "Unidade morta não pode conjurar" };
  }

  // No novo sistema, conjurar sempre funciona
  // O Focus determina a potência do feitiço (usado pelo executor da skill)
  return {
    success: true,
    successes: unit.focus, // Focus direto como "potência"
    threshold: 0,
  };
}

// =============================================================================
// SISTEMA DE SKILLS - Re-exportar do arquivo dedicado
// =============================================================================

import { findSkillByCode } from "../../../shared/data/skills.data";
import {
  getManhattanDistance as getSkillManhattanDistance,
  DEFAULT_RANGE_VALUES,
  type SkillExecutionResult,
  type SkillCombatUnit,
} from "../../../shared/types/skills.types";

// Re-exportar tipos e funções do skill-executors
export {
  executeSkill,
  tickSkillCooldowns,
  isSkillOnCooldown,
  getSkillCooldown,
  SKILL_EXECUTORS,
} from "./skill-executors";

// Re-exportar condições de skills
export {
  SKILL_CONDITIONS,
  getSkillCondition,
  isSkillCondition,
} from "./skill-conditions";

// Alias para compatibilidade
export type SkillActionResult = SkillExecutionResult;

/**
 * Valida se a unidade pode usar uma skill
 */
export function validateSkillUse(
  caster: CombatUnit,
  skillCode: string,
  target: CombatUnit | null,
  isArena: boolean
): { valid: boolean; error?: string } {
  // Verificar se a skill existe
  const skill = findSkillByCode(skillCode);
  if (!skill) {
    return { valid: false, error: "Skill não encontrada" };
  }

  // Verificar se é uma skill ativa
  if (skill.category !== "ACTIVE") {
    return { valid: false, error: "Apenas skills ativas podem ser usadas" };
  }

  // Verificar se a unidade tem essa skill nas ações
  if (!caster.actions.includes(skillCode)) {
    return { valid: false, error: "Unidade não possui esta skill" };
  }

  // Verificar se está vivo
  if (!caster.isAlive) {
    return { valid: false, error: "Unidade morta não pode usar skills" };
  }

  // Verificar se tem ações disponíveis (Arena não tem custo de recurso, mas consome ação)
  if (caster.actionsLeft <= 0) {
    return { valid: false, error: "Sem ações restantes neste turno" };
  }

  // Validar range e alvo
  if (skill.range === "SELF") {
    // Skills SELF não precisam de alvo ou o alvo é o próprio caster
    if (target && target.id !== caster.id) {
      return {
        valid: false,
        error: "Esta skill só pode ser usada em si mesmo",
      };
    }
  } else if (skill.range === "ADJACENT") {
    if (!target) {
      return { valid: false, error: "Skill requer um alvo" };
    }
    if (
      !isAdjacentOmnidirectional(
        caster.posX,
        caster.posY,
        target.posX,
        target.posY
      )
    ) {
      return { valid: false, error: "Alvo não está adjacente" };
    }
  } else if (skill.range === "RANGED" || skill.range === "AREA") {
    if (!target && skill.targetType !== "SELF") {
      return { valid: false, error: "Skill requer um alvo" };
    }
    if (target) {
      const rangeValue = skill.rangeValue ?? DEFAULT_RANGE_VALUES[skill.range];
      const distance = getSkillManhattanDistance(
        caster.posX,
        caster.posY,
        target.posX,
        target.posY
      );
      if (distance > rangeValue) {
        return {
          valid: false,
          error: `Alvo fora de alcance (máx: ${rangeValue})`,
        };
      }
    }
  }

  // Validar tipo de alvo
  if (target && skill.targetType) {
    const isSameOwner = caster.ownerId === target.ownerId;
    if (skill.targetType === "ALLY" && !isSameOwner) {
      return { valid: false, error: "Skill só pode ser usada em aliados" };
    }
    if (skill.targetType === "ENEMY" && isSameOwner) {
      return { valid: false, error: "Skill só pode ser usada em inimigos" };
    }
  }

  return { valid: true };
}

/**
 * Executa uma skill ativa
 * Delega para o sistema de skill-executors
 */
export function executeSkillAction(
  caster: CombatUnit,
  skillCode: string,
  target: CombatUnit | null,
  allUnits: CombatUnit[],
  isArena: boolean = true
): SkillActionResult {
  // Importar dinamicamente para evitar dependência circular
  const { executeSkill } = require("./skill-executors");

  // Validar uso primeiro
  const validation = validateSkillUse(caster, skillCode, target, isArena);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Delegar para o executor centralizado (passa isArena para dobrar cooldown)
  return executeSkill(
    caster as SkillCombatUnit,
    skillCode,
    target as SkillCombatUnit | null,
    allUnits as SkillCombatUnit[],
    isArena
  );
}
