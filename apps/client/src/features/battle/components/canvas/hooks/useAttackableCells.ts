/**
 * Hook para calcular células atacáveis para a unidade selecionada
 * Inclui unidades inimigas e obstáculos adjacentes
 */

import { useMemo } from "react";
import type {
  BattleUnitState,
  BattleObstacleState,
} from "@/services/colyseus.service";
import type { TargetingPreview } from "@boundless/shared/utils/targeting.utils";
import { isPlayerControllable } from "../../../utils/unit-control";

interface UseAttackableCellsParams {
  selectedUnit: BattleUnitState | undefined;
  activeUnitId: string | null | undefined;
  units: BattleUnitState[];
  obstacles: BattleObstacleState[];
  currentUserId: string;
  isMyTurn: boolean;
  pendingAction: string | null | undefined;
  targetingPreview: TargetingPreview | null | undefined;
}

/**
 * Calcula células atacáveis para a unidade selecionada
 * Usa sistema legado quando targetingPreview não está disponível
 */
export function useAttackableCells({
  selectedUnit,
  activeUnitId,
  units,
  obstacles,
  currentUserId,
  isMyTurn,
  pendingAction,
  targetingPreview,
}: UseAttackableCellsParams): Set<string> {
  return useMemo(() => {
    // Se há targetingPreview, usar o novo sistema
    if (targetingPreview) return new Set();

    // Só mostrar quando for meu turno
    if (!isMyTurn) return new Set();

    // Só mostrar quando ação de ataque estiver selecionada
    const isAttackAction =
      pendingAction === "attack" || pendingAction === "ATTACK";
    if (!isAttackAction) return new Set();

    if (!selectedUnit) return new Set();

    // Verificar se é a unidade ativa
    const isActiveOrPending = activeUnitId
      ? selectedUnit.id === activeUnitId
      : isPlayerControllable(selectedUnit, currentUserId);
    if (!isActiveOrPending) return new Set();

    // Pode atacar se tem ações OU ataques extras restantes
    const hasExtraAttacks = (selectedUnit.attacksLeftThisTurn ?? 0) > 0;
    if (selectedUnit.actionsLeft <= 0 && !hasExtraAttacks) return new Set();

    const attackable = new Set<string>();

    // Unidades inimigas adjacentes
    units.forEach((enemy) => {
      if (enemy.ownerId !== currentUserId && enemy.isAlive) {
        const dx = Math.abs(enemy.posX - selectedUnit.posX);
        const dy = Math.abs(enemy.posY - selectedUnit.posY);
        // Chebyshev distance: permite diagonais
        if (Math.max(dx, dy) === 1) {
          attackable.add(`${enemy.posX},${enemy.posY}`);
        }
      }
    });

    // Obstáculos adjacentes também são atacáveis
    obstacles.forEach((obs) => {
      if (!obs.destroyed) {
        const dx = Math.abs(obs.posX - selectedUnit.posX);
        const dy = Math.abs(obs.posY - selectedUnit.posY);
        if (Math.max(dx, dy) === 1) {
          attackable.add(`${obs.posX},${obs.posY}`);
        }
      }
    });

    return attackable;
  }, [
    isMyTurn,
    selectedUnit,
    activeUnitId,
    currentUserId,
    units,
    obstacles,
    pendingAction,
    targetingPreview,
  ]);
}
