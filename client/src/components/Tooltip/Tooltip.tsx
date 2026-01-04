import React, { useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  /** Ref do elemento âncora (o elemento que dispara o tooltip) */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Se o tooltip está visível */
  visible: boolean;
  /** Conteúdo do tooltip */
  children: React.ReactNode;
  /** Largura do tooltip (default: w-48) */
  width?: string;
  /** Posição preferida (default: bottom) */
  preferredPosition?: "top" | "bottom";
}

/**
 * Tooltip inteligente que detecta bordas da tela e ajusta posição
 * Usa createPortal para renderizar fora do fluxo DOM
 */
export const Tooltip: React.FC<TooltipProps> = ({
  anchorRef,
  visible,
  children,
  width = "w-48",
  preferredPosition = "bottom",
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  }>({
    top: -9999,
    left: -9999,
    placement: preferredPosition,
  });

  useLayoutEffect(() => {
    if (!visible || !anchorRef.current || !tooltipRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const GAP = 8;
    let top: number;
    let left: number;
    let placement: "top" | "bottom" = preferredPosition;

    // Calcular posição vertical
    if (preferredPosition === "bottom") {
      top = anchor.bottom + GAP;
      // Se não couber embaixo, tenta em cima
      if (top + tooltip.height > viewport.height - GAP) {
        if (anchor.top - tooltip.height - GAP > GAP) {
          top = anchor.top - tooltip.height - GAP;
          placement = "top";
        }
      }
    } else {
      top = anchor.top - tooltip.height - GAP;
      // Se não couber em cima, tenta embaixo
      if (top < GAP) {
        if (anchor.bottom + tooltip.height + GAP < viewport.height - GAP) {
          top = anchor.bottom + GAP;
          placement = "bottom";
        }
      }
    }

    // Calcular posição horizontal (centralizado)
    left = anchor.left + anchor.width / 2 - tooltip.width / 2;

    // Ajustar para não sair das bordas horizontais
    if (left < GAP) {
      left = GAP;
    } else if (left + tooltip.width > viewport.width - GAP) {
      left = viewport.width - tooltip.width - GAP;
    }

    // Ajustar para não sair das bordas verticais
    if (top < GAP) {
      top = GAP;
    } else if (top + tooltip.height > viewport.height - GAP) {
      top = viewport.height - tooltip.height - GAP;
    }

    setPosition({ top, left, placement });
  }, [visible, anchorRef, preferredPosition]);

  if (!visible) return null;

  const tooltipElement = (
    <div
      ref={tooltipRef}
      className={`fixed z-[99999] ${width} p-2.5 bg-gray-900/95 backdrop-blur-sm border-2 border-gray-600 rounded-lg shadow-2xl pointer-events-none`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
      {/* Seta indicadora */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 rotate-45 w-3 h-3 bg-gray-900 border-gray-600 ${
          position.placement === "bottom"
            ? "-top-1.5 border-l border-t"
            : "-bottom-1.5 border-r border-b"
        }`}
      />
    </div>
  );

  // Renderiza no body via portal para escapar de qualquer overflow
  return createPortal(tooltipElement, document.body);
};

export default Tooltip;
