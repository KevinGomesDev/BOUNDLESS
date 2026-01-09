/**
 * Renderer para o grid estático do canvas de batalha
 * Responsável por desenhar o terreno base com variação natural
 */

import type { TerrainColors, GridColors } from "../types";

interface DrawStaticGridParams {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gridColors: GridColors;
  terrainColors?: TerrainColors;
}

/**
 * Função hash determinística para posição
 * Cria padrão "aleatório" consistente para mesma célula
 */
function hashPosition(x: number, y: number): number {
  const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return hash - Math.floor(hash);
}

/**
 * Desenha o grid estático com variação natural de terreno
 */
export function drawStaticGrid({
  ctx,
  canvasWidth,
  canvasHeight,
  cellSize,
  gridWidth,
  gridHeight,
  gridColors,
  terrainColors,
}: DrawStaticGridParams): void {
  ctx.imageSmoothingEnabled = false;

  // Cores do terreno (com fallback para cores padrão)
  const primaryColor = terrainColors?.primary?.hex || gridColors.cellLight;
  const secondaryColor = terrainColors?.secondary?.hex || gridColors.cellDark;
  const accentColor = terrainColors?.accent?.hex || gridColors.gridDot;

  // Gerar variações de cor para criar efeito de terreno natural
  const terrainColorsList = [primaryColor, secondaryColor, accentColor];

  // Fundo base
  ctx.fillStyle = secondaryColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Desenhar grid com variação natural por célula
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cellX = x * cellSize;
      const cellY = y * cellSize;

      // Selecionar cor baseada em hash da posição (determinístico)
      const hash = hashPosition(x, y);
      const colorIndex = Math.floor(hash * terrainColorsList.length);
      const baseColor = terrainColorsList[colorIndex];

      // Desenhar célula base
      ctx.fillStyle = baseColor;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      // Adicionar "textura" com pequenos detalhes aleatórios
      const detailHash = hashPosition(x * 3, y * 7);
      if (detailHash > 0.7) {
        // 30% das células têm detalhes decorativos
        const detailColor =
          terrainColorsList[(colorIndex + 1) % terrainColorsList.length];
        ctx.fillStyle = detailColor + "40"; // 25% opacity
        const detailX = cellX + detailHash * cellSize * 0.6;
        const detailY = cellY + hashPosition(x * 5, y * 3) * cellSize * 0.6;
        const detailSize = 2 + Math.floor(detailHash * 3);
        ctx.fillRect(detailX, detailY, detailSize, detailSize);
      }

      // Borda sutil
      ctx.strokeStyle = accentColor + "30"; // 19% opacity
      ctx.lineWidth = 1;
      ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellSize - 1, cellSize - 1);
    }
  }
}
