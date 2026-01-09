/**
 * Renderer para obstáculos 2.5D no canvas de batalha
 * Responsável por desenhar blocos 3D com perspectiva dinâmica
 */

import type { BattleObstacleState } from "@/services/colyseus.service";
import type { ObstacleType } from "@boundless/shared/types/battle.types";
import { getObstacleVisualConfig } from "@boundless/shared/config";
import type { Position } from "../types";

interface DrawObstacle3DParams {
  ctx: CanvasRenderingContext2D;
  obstacle: BattleObstacleState;
  cellSize: number;
  perspectivePos: Position;
}

/**
 * Desenha uma face do bloco 3D
 */
function drawFace(
  ctx: CanvasRenderingContext2D,
  points: Position[],
  fillColor: string,
  strokeColor: string = "#000"
): void {
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/**
 * Desenha um obstáculo com efeito 2.5D baseado na posição da perspectiva
 */
export function drawObstacle3D({
  ctx,
  obstacle,
  cellSize,
  perspectivePos,
}: DrawObstacle3DParams): void {
  const config = getObstacleVisualConfig(
    (obstacle.type as ObstacleType) || "ROCK"
  );

  const baseX = obstacle.posX * cellSize;
  const baseY = obstacle.posY * cellSize;

  // Centro do obstáculo
  const centerX = baseX + cellSize / 2;
  const centerY = baseY + cellSize / 2;

  // Vetor do centro para a perspectiva (determina perspectiva)
  const vecX = centerX - perspectivePos.x;
  const vecY = centerY - perspectivePos.y;

  // Força da perspectiva baseada na altura do obstáculo
  const perspectiveStrength = 0.15;
  const shiftX = vecX * perspectiveStrength * config.heightScale;
  const shiftY = vecY * perspectiveStrength * config.heightScale;

  // Tamanho do bloco (ligeiramente menor que a célula para dar espaço)
  const blockSize = cellSize * 0.85;
  const offset = (cellSize - blockSize) / 2;

  // Cantos da base
  const bTL = { x: baseX + offset, y: baseY + offset };
  const bTR = { x: baseX + offset + blockSize, y: baseY + offset };
  const bBR = { x: baseX + offset + blockSize, y: baseY + offset + blockSize };
  const bBL = { x: baseX + offset, y: baseY + offset + blockSize };

  // Cantos do topo (deslocados pela perspectiva)
  const tTL = { x: bTL.x + shiftX, y: bTL.y + shiftY };
  const tTR = { x: bTR.x + shiftX, y: bTR.y + shiftY };
  const tBR = { x: bBR.x + shiftX, y: bBR.y + shiftY };
  const tBL = { x: bBL.x + shiftX, y: bBL.y + shiftY };

  // Face Y (Norte ou Sul)
  if (vecY > 0) {
    drawFace(ctx, [bTL, bTR, tTR, tTL], config.sideYColor);
  } else {
    drawFace(ctx, [bBL, bBR, tBR, tBL], config.sideYColor);
  }

  // Face X (Oeste ou Leste)
  if (vecX > 0) {
    drawFace(ctx, [bTL, bBL, tBL, tTL], config.sideXColor);
  } else {
    drawFace(ctx, [bTR, bBR, tBR, tTR], config.sideXColor);
  }

  // Topo
  ctx.fillStyle = config.topColor;
  ctx.beginPath();
  ctx.moveTo(tTL.x, tTL.y);
  ctx.lineTo(tTR.x, tTR.y);
  ctx.lineTo(tBR.x, tBR.y);
  ctx.lineTo(tBL.x, tBL.y);
  ctx.closePath();
  ctx.fill();

  // Borda do topo (highlight)
  if (config.highlightColor) {
    ctx.strokeStyle = config.highlightColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // HP bar se o obstáculo foi danificado
  if (
    obstacle.hp !== undefined &&
    obstacle.maxHp !== undefined &&
    obstacle.hp < obstacle.maxHp
  ) {
    const hpPercent = obstacle.hp / obstacle.maxHp;
    const barWidth = blockSize * 0.8;
    const barHeight = 4;
    const barX = tTL.x + (blockSize - barWidth) / 2;
    const barY = tTL.y - 8;

    // Background
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // HP
    ctx.fillStyle =
      hpPercent > 0.5 ? "#2ecc71" : hpPercent > 0.25 ? "#f39c12" : "#e74c3c";
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  }
}

interface DrawAllObstaclesParams {
  ctx: CanvasRenderingContext2D;
  obstacles: BattleObstacleState[];
  visibleCells: Set<string>;
  cellSize: number;
  perspectivePos: Position;
}

/**
 * Desenha todos os obstáculos visíveis ordenados por distância
 */
export function drawAllObstacles({
  ctx,
  obstacles,
  visibleCells,
  cellSize,
  perspectivePos,
}: DrawAllObstaclesParams): void {
  // Ordenar obstáculos por distância à perspectiva (mais distantes primeiro)
  const sortedObstacles = [...obstacles]
    .filter(
      (obs) => !obs.destroyed && visibleCells.has(`${obs.posX},${obs.posY}`)
    )
    .sort((a, b) => {
      const aCenterX = a.posX * cellSize + cellSize / 2;
      const aCenterY = a.posY * cellSize + cellSize / 2;
      const bCenterX = b.posX * cellSize + cellSize / 2;
      const bCenterY = b.posY * cellSize + cellSize / 2;
      const aDistSq =
        (aCenterX - perspectivePos.x) ** 2 + (aCenterY - perspectivePos.y) ** 2;
      const bDistSq =
        (bCenterX - perspectivePos.x) ** 2 + (bCenterY - perspectivePos.y) ** 2;
      return bDistSq - aDistSq; // Mais distante primeiro
    });

  // Renderizar obstáculos ordenados
  sortedObstacles.forEach((obstacle) => {
    drawObstacle3D({ ctx, obstacle, cellSize, perspectivePos });
  });
}

/**
 * Calcula a posição de perspectiva baseada nas unidades do jogador
 */
export function calculatePerspectivePosition(
  selectedUnitId: string | null,
  units: Array<{
    id: string;
    posX: number;
    posY: number;
    isAlive: boolean;
    ownerId: string;
  }>,
  currentUserId: string,
  cellSize: number,
  gridWidth: number,
  gridHeight: number
): Position {
  const gridCenterX = (gridWidth * cellSize) / 2;
  const gridCenterY = (gridHeight * cellSize) / 2;
  let perspectivePos = { x: gridCenterX, y: gridCenterY };

  // Primeiro, tentar usar a unidade selecionada
  const perspectiveUnit = selectedUnitId
    ? units.find((u) => u.id === selectedUnitId)
    : null;

  if (perspectiveUnit && perspectiveUnit.isAlive) {
    perspectivePos = {
      x: perspectiveUnit.posX * cellSize + cellSize / 2,
      y: perspectiveUnit.posY * cellSize + cellSize / 2,
    };
  } else {
    // Fallback: usar a unidade do jogador mais próxima do centro do grid
    const myAliveUnits = units.filter(
      (u) => u.ownerId === currentUserId && u.isAlive
    );

    if (myAliveUnits.length > 0) {
      let closestUnit = myAliveUnits[0];
      let closestDistSq = Infinity;

      for (const unit of myAliveUnits) {
        const unitCenterX = unit.posX * cellSize + cellSize / 2;
        const unitCenterY = unit.posY * cellSize + cellSize / 2;
        const distSq =
          (unitCenterX - gridCenterX) ** 2 + (unitCenterY - gridCenterY) ** 2;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestUnit = unit;
        }
      }

      perspectivePos = {
        x: closestUnit.posX * cellSize + cellSize / 2,
        y: closestUnit.posY * cellSize + cellSize / 2,
      };
    }
  }

  return perspectivePos;
}
