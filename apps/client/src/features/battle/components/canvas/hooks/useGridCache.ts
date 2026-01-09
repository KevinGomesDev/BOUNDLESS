/**
 * Hook para gerenciar o cache do grid estático
 * Evita redesenhar terreno a cada frame
 */

import { useRef, useCallback, useEffect } from "react";
import { drawStaticGrid } from "../renderers";
import type { GridColors, TerrainColors } from "../types";

interface UseGridCacheParams {
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gridColors: GridColors;
  terrainColors?: TerrainColors;
}

interface UseGridCacheResult {
  /** Canvas de cache do grid */
  gridCacheRef: React.MutableRefObject<HTMLCanvasElement | null>;
  /** Atualiza o cache se necessário */
  updateGridCache: () => void;
}

/**
 * Gerencia cache offscreen do grid estático para melhor performance
 */
export function useGridCache({
  canvasWidth,
  canvasHeight,
  cellSize,
  gridWidth,
  gridHeight,
  gridColors,
  terrainColors,
}: UseGridCacheParams): UseGridCacheResult {
  const gridCacheRef = useRef<HTMLCanvasElement | null>(null);
  const gridCacheValidRef = useRef(false);

  // Invalidar cache quando dependências mudam
  useEffect(() => {
    gridCacheValidRef.current = false;
  }, [canvasWidth, canvasHeight, gridColors, terrainColors]);

  const updateGridCache = useCallback(() => {
    // Criar/redimensionar canvas de cache se necessário
    if (!gridCacheRef.current) {
      gridCacheRef.current = document.createElement("canvas");
    }

    const cache = gridCacheRef.current;
    if (cache.width !== canvasWidth || cache.height !== canvasHeight) {
      cache.width = canvasWidth;
      cache.height = canvasHeight;
      gridCacheValidRef.current = false;
    }

    // Se cache já está válido, não redesenha
    if (gridCacheValidRef.current) return;

    const ctx = cache.getContext("2d");
    if (!ctx) return;

    drawStaticGrid({
      ctx,
      canvasWidth,
      canvasHeight,
      cellSize,
      gridWidth,
      gridHeight,
      gridColors,
      terrainColors,
    });

    gridCacheValidRef.current = true;
  }, [
    canvasWidth,
    canvasHeight,
    cellSize,
    gridWidth,
    gridHeight,
    gridColors,
    terrainColors,
  ]);

  return { gridCacheRef, updateGridCache };
}
