/**
 * Hook para calcular células movíveis para a unidade selecionada
 * Inclui cálculo de custo de movimento, penalidades de engajamento e células de disparada
 */

import { useMemo } from "react";
import type {
  BattleUnitState,
  BattleObstacleState,
} from "@/services/colyseus.service";
import {
  getFullMovementInfo,
  type MovementCellInfo,
} from "@boundless/shared/utils/engagement.utils";
import {
  canUseDash,
  hasDashingCondition,
} from "@boundless/shared/data/conditions.data";
import { isPlayerControllable } from "../../../utils/unit-control";

interface UseMovableCellsParams {
  selectedUnit: BattleUnitState | undefined;
  activeUnitId: string | null | undefined;
  units: BattleUnitState[];
  obstacles: BattleObstacleState[];
  visibleCells: Set<string>;
  unitPositionMap: Map<string, BattleUnitState>;
  corpsePositionMap: Map<string, BattleUnitState>;
  obstaclePositionMap: Map<string, BattleObstacleState>;
  currentUserId: string;
  isMyTurn: boolean;
  gridWidth: number;
  gridHeight: number;
}

interface UseMovableCellsResult {
  /** Map com informações completas de movimento por célula */
  movableCellsMap: Map<string, MovementCellInfo>;
  /** Set simples com apenas células movíveis (não bloqueadas) */
  movableCells: Set<string>;
  /** Map com células alcançáveis com disparada (além do movimento normal) */
  dashableCellsMap: Map<string, MovementCellInfo>;
  /** Set simples com células de disparada */
  dashableCells: Set<string>;
  /** Se a unidade pode usar dash */
  canDash: boolean;
}

/**
 * Calcula células movíveis e custo de movimento para a unidade selecionada
 * Também calcula células alcançáveis com disparada (dash)
 */
export function useMovableCells({
  selectedUnit,
  activeUnitId,
  units,
  obstacles,
  visibleCells,
  unitPositionMap,
  corpsePositionMap,
  obstaclePositionMap,
  currentUserId,
  isMyTurn,
  gridWidth,
  gridHeight,
}: UseMovableCellsParams): UseMovableCellsResult {
  // Verificar se pode usar dash
  const canDash = useMemo((): boolean => {
    if (!isMyTurn || !selectedUnit) return false;

    // Verificar se é a unidade ativa OU se activeUnitId está indefinido
    const isActiveOrPending = activeUnitId
      ? selectedUnit.id === activeUnitId
      : isPlayerControllable(selectedUnit, currentUserId);
    if (!isActiveOrPending) return false;

    // Já tem DASHING ativo? Não pode usar de novo
    if (hasDashingCondition(selectedUnit.conditions)) return false;

    // Verificar condições e ações
    return canUseDash(selectedUnit.conditions, selectedUnit.actionsLeft);
  }, [isMyTurn, selectedUnit, activeUnitId, currentUserId]);

  // Células movíveis como Map com informação completa
  const movableCellsMap = useMemo((): Map<string, MovementCellInfo> => {
    if (!isMyTurn) return new Map();
    if (!selectedUnit || selectedUnit.movesLeft <= 0) return new Map();

    // Verificar se é a unidade ativa OU se activeUnitId está indefinido
    const isActiveOrPending = activeUnitId
      ? selectedUnit.id === activeUnitId
      : isPlayerControllable(selectedUnit, currentUserId);
    if (!isActiveOrPending) return new Map();

    const movable = new Map<string, MovementCellInfo>();
    const range = selectedUnit.movesLeft;

    // Expandir range para considerar potenciais penalidades de engajamento
    const maxRange = range + 10;

    for (let dx = -maxRange; dx <= maxRange; dx++) {
      for (let dy = -maxRange; dy <= maxRange; dy++) {
        if (dx === 0 && dy === 0) continue;

        const nx = selectedUnit.posX + dx;
        const ny = selectedUnit.posY + dy;

        if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;

        const key = `${nx},${ny}`;

        // Verificar se a célula está visível
        if (!visibleCells.has(key)) continue;

        // Verificar se não tem unidade, cadáver ou obstáculo
        if (
          unitPositionMap.has(key) ||
          corpsePositionMap.has(key) ||
          obstaclePositionMap.has(key)
        ) {
          continue;
        }

        // Calcular informações completas de movimento
        const moveInfo = getFullMovementInfo(
          selectedUnit,
          nx,
          ny,
          units,
          obstacles,
          gridWidth,
          gridHeight
        );

        // Adicionar apenas se o custo está dentro do range e não bloqueado
        const inMoveRange = moveInfo.totalCost <= selectedUnit.movesLeft;

        if (inMoveRange && !moveInfo.isBlocked) {
          movable.set(key, moveInfo);
        }
      }
    }
    return movable;
  }, [
    isMyTurn,
    selectedUnit,
    activeUnitId,
    currentUserId,
    unitPositionMap,
    corpsePositionMap,
    obstaclePositionMap,
    visibleCells,
    units,
    obstacles,
    gridWidth,
    gridHeight,
  ]);

  // Set simples para compatibilidade
  const movableCells = useMemo((): Set<string> => {
    const cells = new Set<string>();
    movableCellsMap.forEach((info, key) => {
      if (!info.isBlocked) {
        cells.add(key);
      }
    });
    return cells;
  }, [movableCellsMap]);

  // Células alcançáveis com disparada (além do movimento normal)
  const dashableCellsMap = useMemo((): Map<string, MovementCellInfo> => {
    if (!canDash || !selectedUnit) return new Map();

    const dashable = new Map<string, MovementCellInfo>();

    // Movimento com dash = movesLeft atual + speed (disparada dobra o movimento)
    const dashRange = selectedUnit.movesLeft + selectedUnit.speed;

    // Expandir range para considerar potenciais penalidades de engajamento
    const maxRange = dashRange + 10;

    for (let dx = -maxRange; dx <= maxRange; dx++) {
      for (let dy = -maxRange; dy <= maxRange; dy++) {
        if (dx === 0 && dy === 0) continue;

        const nx = selectedUnit.posX + dx;
        const ny = selectedUnit.posY + dy;

        if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) continue;

        const key = `${nx},${ny}`;

        // Pular células que já são movíveis normalmente
        if (movableCellsMap.has(key)) continue;

        // Verificar se a célula está visível
        if (!visibleCells.has(key)) continue;

        // Verificar se não tem unidade, cadáver ou obstáculo
        if (
          unitPositionMap.has(key) ||
          corpsePositionMap.has(key) ||
          obstaclePositionMap.has(key)
        ) {
          continue;
        }

        // Calcular informações completas de movimento
        const moveInfo = getFullMovementInfo(
          selectedUnit,
          nx,
          ny,
          units,
          obstacles,
          gridWidth,
          gridHeight
        );

        // Adicionar apenas se o custo está dentro do range COM dash e não bloqueado
        const inDashRange = moveInfo.totalCost <= dashRange;

        if (inDashRange && !moveInfo.isBlocked) {
          dashable.set(key, moveInfo);
        }
      }
    }
    return dashable;
  }, [
    canDash,
    selectedUnit,
    movableCellsMap,
    unitPositionMap,
    corpsePositionMap,
    obstaclePositionMap,
    visibleCells,
    units,
    obstacles,
    gridWidth,
    gridHeight,
  ]);

  // Set simples para células de dash
  const dashableCells = useMemo((): Set<string> => {
    const cells = new Set<string>();
    dashableCellsMap.forEach((info, key) => {
      if (!info.isBlocked) {
        cells.add(key);
      }
    });
    return cells;
  }, [dashableCellsMap]);

  return {
    movableCellsMap,
    movableCells,
    dashableCellsMap,
    dashableCells,
    canDash,
  };
}
