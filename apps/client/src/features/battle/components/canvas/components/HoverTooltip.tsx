/**
 * Tooltip de hover sobre entidades
 * Mostra informações básicas de unidades e obstáculos
 */

import { memo } from "react";
import { createPortal } from "react-dom";
import type { HoverTooltipInfo } from "../types";

interface HoverTooltipProps {
  info: HoverTooltipInfo;
  mousePosition: { clientX: number; clientY: number };
}

/**
 * Tooltip flutuante para hover sobre unidades/obstáculos
 */
export const HoverTooltip = memo<HoverTooltipProps>(
  ({ info, mousePosition }) => {
    const colorClasses = {
      blue: "bg-blue-900/90 text-blue-100 border-blue-500/50",
      red: "bg-red-900/90 text-red-100 border-red-500/50",
      gray: "bg-gray-800/90 text-gray-200 border-gray-500/50",
    };

    const statusClasses = {
      Vivo: "text-green-300",
      Morto: "text-red-300",
      default: "text-gray-400",
    };

    return createPortal(
      <div
        className="fixed z-[9998] pointer-events-none"
        style={{
          left: mousePosition.clientX + 12,
          top: mousePosition.clientY - 8,
        }}
      >
        <div
          className={`px-2 py-1 rounded text-[10px] shadow-lg border backdrop-blur-sm ${
            colorClasses[info.color]
          }`}
        >
          <span className="font-semibold">{info.name}</span>
          <span className="mx-1 opacity-50">•</span>
          <span className="opacity-75">{info.relation}</span>
          <span className="mx-1 opacity-50">•</span>
          <span
            className={
              statusClasses[info.status as keyof typeof statusClasses] ||
              statusClasses.default
            }
          >
            {info.status}
          </span>
        </div>
      </div>,
      document.body
    );
  }
);

HoverTooltip.displayName = "HoverTooltip";
