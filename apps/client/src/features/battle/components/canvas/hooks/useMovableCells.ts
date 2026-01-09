/**
 * Hook para calcular células movíveis para a unidade selecionada
 * Inclui cálculo de custo de movimento e penalidades de engajamento
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
}

/**
 * Calcula células movíveis e custo de movimento para a unidade selecionada
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

  return { movableCellsMap, movableCells };
}
