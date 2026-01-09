/**
 * Hook para gerenciar interações do mouse no canvas
 * Handlers para click, hover, drag e right-click
 */

import { useCallback, useRef, useState, useEffect } from "react";
import type {
  BattleUnitState,
  BattleObstacleState,
} from "@/services/colyseus.service";
import type { Position } from "../types";

interface UseCanvasMouseParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  unitPositionMap: Map<string, BattleUnitState>;
  obstaclePositionMap: Map<string, BattleObstacleState>;
  onCellClick?: (x: number, y: number) => void;
  onUnitClick?: (unit: BattleUnitState) => void;
  onObstacleClick?: (obstacle: BattleObstacleState) => void;
  onRightClick?: () => void;
  onCellHover?: (cell: Position | null) => void;
}

interface UseCanvasMouseResult {
  hoveredCell: Position | null;
  mousePosition: { clientX: number; clientY: number } | null;
  handleMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleMouseLeave: () => void;
  handleMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  handleContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

// Tolerância para distinguir click de drag
const DRAG_THRESHOLD = 5;

/**
 * Gerencia interações do mouse no canvas de batalha
 */
export function useCanvasMouse({
  canvasRef,
  canvasWidth,
  canvasHeight,
  cellSize,
  gridWidth,
  gridHeight,
  unitPositionMap,
  obstaclePositionMap,
  onCellClick,
  onUnitClick,
  onObstacleClick,
  onRightClick,
  onCellHover,
}: UseCanvasMouseParams): UseCanvasMouseResult {
  const [hoveredCell, setHoveredCell] = useState<Position | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);

  // Ref para detectar drag vs click
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);

  // Notificar parent sobre mudança de hoveredCell
  useEffect(() => {
    onCellHover?.(hoveredCell);
  }, [hoveredCell, onCellHover]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      // Calcular posição considerando o zoom/scale do canvas
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);

      // Armazenar posição do mouse para tooltip
      setMousePosition({ clientX: e.clientX, clientY: e.clientY });

      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        setHoveredCell((prev) => {
          if (prev?.x === x && prev?.y === y) return prev;
          return { x, y };
        });
      } else {
        setHoveredCell(null);
      }
    },
    [canvasRef, gridWidth, gridHeight, canvasWidth, canvasHeight, cellSize]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
    setMousePosition(null);
    mouseDownPosRef.current = null;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Verificar se foi um drag
      if (mouseDownPosRef.current) {
        const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          mouseDownPosRef.current = null;
          return;
        }
      }
      mouseDownPosRef.current = null;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
      const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);

      if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
        const clickedUnit = unitPositionMap.get(`${x},${y}`);
        const clickedObstacle = obstaclePositionMap.get(`${x},${y}`);

        if (clickedUnit) {
          onUnitClick?.(clickedUnit);
        } else if (clickedObstacle) {
          onObstacleClick?.(clickedObstacle);
        } else {
          onCellClick?.(x, y);
        }
      }
    },
    [
      canvasRef,
      unitPositionMap,
      obstaclePositionMap,
      onCellClick,
      onUnitClick,
      onObstacleClick,
      gridWidth,
      gridHeight,
      canvasWidth,
      canvasHeight,
      cellSize,
    ]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      onRightClick?.();
    },
    [onRightClick]
  );

  return {
    hoveredCell,
    mousePosition,
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
    handleClick,
    handleContextMenu,
  };
}
