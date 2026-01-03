import { useEffect, useCallback } from "react";
import type { BattleUnit } from "../../../../../shared/types/battle.types";

interface UseBattleKeyboardOptions {
  selectedUnit: BattleUnit | null;
  isMyTurn: boolean;
  canMove: boolean;
  onMoveDirection: (dx: number, dy: number) => void;
  enabled?: boolean;
}

/**
 * Hook para controle WASD do movimento de unidades na batalha
 */
export function useBattleKeyboard({
  selectedUnit,
  isMyTurn,
  canMove,
  onMoveDirection,
  enabled = true,
}: UseBattleKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || !selectedUnit || !isMyTurn || !canMove) return;

      // Ignorar se estiver em input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      let dx = 0;
      let dy = 0;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          dy = -1;
          break;
        case "s":
        case "arrowdown":
          dy = 1;
          break;
        case "a":
        case "arrowleft":
          dx = -1;
          break;
        case "d":
        case "arrowright":
          dx = 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onMoveDirection(dx, dy);
    },
    [enabled, selectedUnit, isMyTurn, canMove, onMoveDirection]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
