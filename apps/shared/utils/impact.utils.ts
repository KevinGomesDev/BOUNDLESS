// shared/utils/impact.utils.ts
// Utilitários para cálculo de impacto/knockback de habilidades

import type { ImpactConfig, DynamicValue } from "../types/ability.types";
import { resolveDynamicValue } from "../types/ability.types";

// =============================================================================
// TIPOS
// =============================================================================

/**
 * Representa uma unidade básica para cálculo de impacto
 */
export interface ImpactUnit {
  id: string;
  posX: number;
  posY: number;
  isAlive: boolean;
  /** Atributos para resolver valores dinâmicos */
  combat: number;
  speed: number;
  focus: number;
  resistance: number;
  will: number;
  vitality: number;
  level: number;
}

/**
 * Representa um obstáculo para cálculo de impacto
 */
export interface ImpactObstacle {
  id: string;
  posX: number;
  posY: number;
  destroyed: boolean;
  /** Dimensão do obstáculo (1x1, 2x2, etc) */
  dimension?: number;
}

/**
 * Direção do impacto
 */
export type ImpactDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

/**
 * Resultado do cálculo de impacto para uma unidade
 */
export interface ImpactResult {
  /** ID da unidade afetada */
  unitId: string;
  /** Posição original */
  fromX: number;
  fromY: number;
  /** Nova posição após impacto */
  toX: number;
  toY: number;
  /** Distância real empurrada (pode ser menor que o máximo se colidiu) */
  distancePushed: number;
  /** Se houve colisão */
  collided: boolean;
  /** Tipo de colisão */
  collisionType?: "UNIT" | "OBSTACLE" | "EDGE";
  /** ID da unidade com quem colidiu (se aplicável) */
  collidedWithUnitId?: string;
  /** ID do obstáculo com quem colidiu (se aplicável) */
  collidedWithObstacleId?: string;
  /** Dano extra por colisão (0 se não colidiu ou collisionDamage = false) */
  collisionDamage: number;
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Calcula a direção do impacto baseado na origem e posição do alvo
 * O impacto empurra NA DIREÇÃO OPOSTA à origem
 */
export function calculateImpactDirection(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number
): ImpactDirection {
  const dx = targetX - originX;
  const dy = targetY - originY;

  // Prioriza a maior diferença
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "RIGHT" : "LEFT";
  } else {
    return dy >= 0 ? "DOWN" : "UP";
  }
}

/**
 * Retorna o delta de movimento para uma direção
 */
export function getDirectionDelta(direction: ImpactDirection): {
  dx: number;
  dy: number;
} {
  switch (direction) {
    case "UP":
      return { dx: 0, dy: -1 };
    case "DOWN":
      return { dx: 0, dy: 1 };
    case "LEFT":
      return { dx: -1, dy: 0 };
    case "RIGHT":
      return { dx: 1, dy: 0 };
  }
}

/**
 * Verifica se uma célula está ocupada por uma unidade
 */
function isCellOccupiedByUnit(
  x: number,
  y: number,
  units: ImpactUnit[],
  excludeUnitId?: string
): ImpactUnit | null {
  for (const unit of units) {
    if (!unit.isAlive) continue;
    if (unit.id === excludeUnitId) continue;
    if (unit.posX === x && unit.posY === y) {
      return unit;
    }
  }
  return null;
}

/**
 * Verifica se uma célula está ocupada por um obstáculo
 */
function isCellOccupiedByObstacle(
  x: number,
  y: number,
  obstacles: ImpactObstacle[]
): ImpactObstacle | null {
  for (const obs of obstacles) {
    if (obs.destroyed) continue;
    const dim = obs.dimension ?? 1;
    for (let ox = 0; ox < dim; ox++) {
      for (let oy = 0; oy < dim; oy++) {
        if (obs.posX + ox === x && obs.posY + oy === y) {
          return obs;
        }
      }
    }
  }
  return null;
}

/**
 * Verifica se uma célula está fora do grid
 */
function isCellOutOfBounds(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  return x < 0 || x >= gridWidth || y < 0 || y >= gridHeight;
}

// =============================================================================
// FUNÇÃO PRINCIPAL
// =============================================================================

/**
 * Calcula o resultado do impacto para uma unidade
 *
 * @param target - Unidade que será empurrada
 * @param originX - Posição X da origem do impacto (ex: centro da explosão)
 * @param originY - Posição Y da origem do impacto
 * @param impactConfig - Configuração do impacto da ability
 * @param casterAttributes - Atributos do caster (para resolver valores dinâmicos)
 * @param baseDamage - Dano base da ability (para calcular dano de colisão)
 * @param allUnits - Todas as unidades na batalha
 * @param obstacles - Obstáculos na batalha
 * @param gridWidth - Largura do grid
 * @param gridHeight - Altura do grid
 */
export function calculateImpactResult(
  target: ImpactUnit,
  originX: number,
  originY: number,
  impactConfig: ImpactConfig,
  casterAttributes: {
    combat: number;
    speed: number;
    focus: number;
    resistance: number;
    will: number;
    vitality: number;
    level: number;
  },
  baseDamage: number,
  allUnits: ImpactUnit[],
  obstacles: ImpactObstacle[],
  gridWidth: number,
  gridHeight: number
): ImpactResult {
  // Resolver distância do impacto
  const maxDistance = resolveDynamicValue(
    impactConfig.distance,
    casterAttributes
  );

  // Calcular direção do empurrão (oposta à origem)
  const direction = calculateImpactDirection(
    originX,
    originY,
    target.posX,
    target.posY
  );
  const delta = getDirectionDelta(direction);

  // Simular movimento célula a célula
  let currentX = target.posX;
  let currentY = target.posY;
  let distancePushed = 0;
  let collided = false;
  let collisionType: "UNIT" | "OBSTACLE" | "EDGE" | undefined;
  let collidedWithUnitId: string | undefined;
  let collidedWithObstacleId: string | undefined;

  for (let i = 0; i < maxDistance; i++) {
    const nextX = currentX + delta.dx;
    const nextY = currentY + delta.dy;

    // Verificar borda do grid
    if (isCellOutOfBounds(nextX, nextY, gridWidth, gridHeight)) {
      collided = true;
      collisionType = "EDGE";
      break;
    }

    // Verificar obstáculo
    if (impactConfig.stopsAtObstacles !== false) {
      const obstacle = isCellOccupiedByObstacle(nextX, nextY, obstacles);
      if (obstacle) {
        collided = true;
        collisionType = "OBSTACLE";
        collidedWithObstacleId = obstacle.id;
        break;
      }
    }

    // Verificar outra unidade
    if (impactConfig.stopsAtUnits !== false) {
      const unit = isCellOccupiedByUnit(nextX, nextY, allUnits, target.id);
      if (unit) {
        collided = true;
        collisionType = "UNIT";
        collidedWithUnitId = unit.id;
        break;
      }
    }

    // Movimento válido
    currentX = nextX;
    currentY = nextY;
    distancePushed++;
  }

  // Calcular dano de colisão
  let collisionDamage = 0;
  if (collided && impactConfig.collisionDamage) {
    const percent = impactConfig.collisionDamagePercent ?? 0.5;
    collisionDamage = Math.round(baseDamage * percent);
  }

  return {
    unitId: target.id,
    fromX: target.posX,
    fromY: target.posY,
    toX: currentX,
    toY: currentY,
    distancePushed,
    collided,
    collisionType,
    collidedWithUnitId,
    collidedWithObstacleId,
    collisionDamage,
  };
}

/**
 * Calcula impacto para múltiplas unidades atingidas por uma ability de área
 * Processa em ordem de distância da origem (mais próximos primeiro)
 */
export function calculateMultipleImpacts(
  targets: ImpactUnit[],
  originX: number,
  originY: number,
  impactConfig: ImpactConfig,
  casterAttributes: {
    combat: number;
    speed: number;
    focus: number;
    resistance: number;
    will: number;
    vitality: number;
    level: number;
  },
  baseDamage: number,
  allUnits: ImpactUnit[],
  obstacles: ImpactObstacle[],
  gridWidth: number,
  gridHeight: number
): ImpactResult[] {
  // Ordenar por distância da origem (mais próximos primeiro)
  const sortedTargets = [...targets].sort((a, b) => {
    const distA = Math.abs(a.posX - originX) + Math.abs(a.posY - originY);
    const distB = Math.abs(b.posX - originX) + Math.abs(b.posY - originY);
    return distA - distB;
  });

  const results: ImpactResult[] = [];

  // Clonar unidades para simular posições atualizadas
  const updatedUnits = allUnits.map((u) => ({ ...u }));

  for (const target of sortedTargets) {
    const result = calculateImpactResult(
      target,
      originX,
      originY,
      impactConfig,
      casterAttributes,
      baseDamage,
      updatedUnits,
      obstacles,
      gridWidth,
      gridHeight
    );

    results.push(result);

    // Atualizar posição da unidade para próximo cálculo
    const unitToUpdate = updatedUnits.find((u) => u.id === target.id);
    if (unitToUpdate) {
      unitToUpdate.posX = result.toX;
      unitToUpdate.posY = result.toY;
    }
  }

  return results;
}
