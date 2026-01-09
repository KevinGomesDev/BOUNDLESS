/**
 * Tooltip de custo de movimento
 * Mostra custo e penalidades de engajamento
 */

import { memo } from "react";
import { createPortal } from "react-dom";
import type { MovementTooltipInfo } from "../types";

interface MovementTooltipProps {
  info: MovementTooltipInfo;
  mousePosition: { clientX: number; clientY: number };
}

/**
 * Tooltip flutuante que exibe o custo de movimento
 */
export const MovementTooltip = memo<MovementTooltipProps>(
  ({ info, mousePosition }) => {
    return createPortal(
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: mousePosition.clientX + 12,
          top: mousePosition.clientY - 8,
        }}
      >
        <div
          className={`px-2 py-1 rounded text-xs font-bold shadow-lg border ${
            info.hasEngagementPenalty
              ? "bg-orange-900/95 text-orange-200 border-orange-500"
              : "bg-green-900/95 text-green-200 border-green-500"
          }`}
        >
          <div className="flex items-center gap-1">
            <span>👟</span>
            <span>Custo: {info.totalCost}</span>
          </div>
          {info.hasEngagementPenalty && (
            <div className="text-orange-300 text-[10px] mt-0.5">
              ⚠️ Penalidade de engajamento
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }
);

MovementTooltip.displayName = "MovementTooltip";
