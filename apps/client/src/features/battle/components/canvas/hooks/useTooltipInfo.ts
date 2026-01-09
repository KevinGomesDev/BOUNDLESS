/**
 * Hook para calcular informações de tooltip
 * Tooltips de movimento e hover sobre entidades
 */

import { useMemo } from "react";
import type {
  BattleUnitState,
  BattleObstacleState,
} from "@/services/colyseus.service";
import type { MovementCellInfo } from "@boundless/shared/utils/engagement.utils";
import type { Position, MovementTooltipInfo, HoverTooltipInfo } from "../types";

interface UseTooltipInfoParams {
  hoveredCell: Position | null;
  mousePosition: { clientX: number; clientY: number } | null;
  movableCellsMap: Map<string, MovementCellInfo>;
  unitPositionMap: Map<string, BattleUnitState>;
  obstaclePositionMap: Map<string, BattleObstacleState>;
  currentUserId: string;
}

interface UseTooltipInfoResult {
  /** Tooltip de custo de movimento */
  tooltipInfo: MovementTooltipInfo | null;
  /** Tooltip de hover sobre entidade */
  hoverTooltip: HoverTooltipInfo | null;
}

/**
 * Calcula informações de tooltip baseado na célula hover
 */
export function useTooltipInfo({
  hoveredCell,
  mousePosition,
  movableCellsMap,
  unitPositionMap,
  obstaclePositionMap,
  currentUserId,
}: UseTooltipInfoParams): UseTooltipInfoResult {
  // Tooltip de custo de movimento
  const tooltipInfo = useMemo(() => {
    if (!hoveredCell || !mousePosition) return null;
    const cellKey = `${hoveredCell.x},${hoveredCell.y}`;
    const cellInfo = movableCellsMap.get(cellKey);
    if (!cellInfo) return null;

    return {
      totalCost: cellInfo.totalCost,
      hasEngagementPenalty: cellInfo.hasEngagementPenalty,
      type: cellInfo.type,
    };
  }, [hoveredCell, mousePosition, movableCellsMap]);

  // Tooltip de hover sobre entidade
  const hoverTooltip = useMemo(() => {
    if (!hoveredCell || !mousePosition) return null;
    const cellKey = `${hoveredCell.x},${hoveredCell.y}`;

    // Verificar unidade
    const unit = unitPositionMap.get(cellKey);
    if (unit) {
      const isAlly = unit.ownerId === currentUserId;
      return {
        name: unit.name,
        relation: isAlly ? "Aliado" : "Inimigo",
        status: unit.isAlive ? "Vivo" : "Morto",
        color: isAlly ? "blue" : "red",
      } as HoverTooltipInfo;
    }

    // Verificar obstáculo
    const obstacle = obstaclePositionMap.get(cellKey);
    if (obstacle) {
      return {
        name: obstacle.emoji,
        relation: "—",
        status: obstacle.destroyed ? "Destruído" : "Obstáculo",
        color: "gray",
      } as HoverTooltipInfo;
    }

    return null;
  }, [
    hoveredCell,
    mousePosition,
    unitPositionMap,
    obstaclePositionMap,
    currentUserId,
  ]);

  return { tooltipInfo, hoverTooltip };
}
