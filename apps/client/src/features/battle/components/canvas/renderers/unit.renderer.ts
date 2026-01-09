/**
 * Renderer para unidades no canvas de batalha
 * Responsável por desenhar sprites, condições e balões de fala
 */

import type { BattleUnitState } from "@/services/colyseus.service";
import type { SpriteDirection } from "../sprite.config";
import { UNIT_RENDER_CONFIG } from "../canvas.constants";

interface PlayerColors {
  primary: string;
  secondary: string;
  highlight: string;
}

interface SpriteConfig {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  row: number;
  loop: boolean;
}

interface LoadedSprite {
  image: HTMLImageElement;
  config: SpriteConfig;
}

interface DrawUnitParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  unit: BattleUnitState;
  isOwned: boolean;
  isSelected: boolean;
  direction: SpriteDirection;
  sprite: LoadedSprite | null;
  spritesLoaded: boolean;
  currentFrame: number;
  playerColors: PlayerColors;
}

/**
 * Desenha uma unidade usando sprite ou fallback procedural
 */
export function drawUnit({
  ctx,
  x,
  y,
  size,
  unit: _unit,
  isOwned,
  isSelected,
  direction,
  sprite,
  spritesLoaded,
  currentFrame,
  playerColors,
}: DrawUnitParams): void {
  void _unit; // Used for type information
  // Se o sprite está carregado, usa ele
  if (sprite && spritesLoaded) {
    const { image, config } = sprite;
    const { frameWidth, frameHeight, frameCount } = config;

    // Calcular posição no sprite sheet
    const srcX = (currentFrame % frameCount) * frameWidth;
    const srcY = config.row * frameHeight;

    // Sprite maior, centralizado verticalmente
    const destSize = size * UNIT_RENDER_CONFIG.spriteScale;
    const offsetX = (size - destSize) / 2;
    const offsetY = size * UNIT_RENDER_CONFIG.verticalOffset;

    const shouldFlip = direction === "left";

    ctx.save();

    // Aplicar flip se necessário
    if (shouldFlip) {
      ctx.translate(x + size, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        srcX,
        srcY,
        frameWidth,
        frameHeight,
        offsetX,
        offsetY,
        destSize,
        destSize
      );
    } else {
      ctx.drawImage(
        image,
        srcX,
        srcY,
        frameWidth,
        frameHeight,
        x + offsetX,
        y + offsetY,
        destSize,
        destSize
      );
    }

    ctx.restore();
  } else {
    // Fallback: desenho procedural caso sprite não carregue
    drawProceduralUnit(ctx, x, y, size, isOwned, playerColors);
  }

  // Seleção manual - quadrado vermelho com gap de 2px
  if (isSelected) {
    ctx.strokeStyle = "#ef4444"; // Vermelho
    ctx.lineWidth = 2;
    const gap = 2;
    ctx.strokeRect(x + gap, y + gap, size - gap * 2, size - gap * 2);
  }
}

/**
 * Desenha uma unidade com arte procedural (fallback)
 */
function drawProceduralUnit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  _isOwned: boolean,
  colors: PlayerColors
): void {
  void _isOwned; // Reserved for future use
  const px = Math.max(2, size / 16);
  const offsetX = x + size * 0.15;
  const offsetY = y + size * 0.1;

  // Coroa
  ctx.fillStyle = colors.highlight;
  ctx.fillRect(offsetX + size * 0.35, offsetY, px * 2, px);

  // Cabeça
  ctx.fillStyle = colors.primary;
  ctx.fillRect(offsetX + size * 0.2, offsetY + px, size * 0.5, px * 3);

  // Olhos
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(offsetX + size * 0.25, offsetY + px * 2, px, px);
  ctx.fillRect(offsetX + size * 0.45, offsetY + px * 2, px, px);

  // Corpo
  ctx.fillStyle = colors.primary;
  ctx.fillRect(offsetX + size * 0.15, offsetY + px * 4, size * 0.6, px * 3);

  // Detalhe armadura
  ctx.fillStyle = colors.highlight;
  ctx.fillRect(offsetX + size * 0.3, offsetY + px * 4, size * 0.2, px);

  // Pernas
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(offsetX + size * 0.2, offsetY + px * 7, px * 2, px * 2);
  ctx.fillRect(offsetX + size * 0.45, offsetY + px * 7, px * 2, px * 2);

  // Espada
  ctx.fillStyle = "#c0c0c0";
  ctx.fillRect(offsetX + size * 0.7, offsetY + px * 3, px, px * 4);
  ctx.fillStyle = "#8b4513";
  ctx.fillRect(offsetX + size * 0.7, offsetY + px * 7, px, px * 2);
}

interface DrawConditionsParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  conditions: string[];
  conditionColors: Record<string, string>;
}

/**
 * Desenha indicadores de condições sobre a unidade
 */
export function drawConditions({
  ctx,
  x,
  y,
  conditions,
  conditionColors,
}: DrawConditionsParams): void {
  conditions.slice(0, 3).forEach((cond, i) => {
    ctx.fillStyle = conditionColors[cond] || "#ffffff";
    ctx.fillRect(x + 4 + i * 6, y + 2, 4, 4);
  });
}

interface DrawSpeechBubbleParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  message: string;
  isOwned: boolean;
}

/**
 * Desenha balão de fala sobre a unidade
 */
export function drawSpeechBubble({
  ctx,
  x,
  y,
  size,
  message,
  isOwned,
}: DrawSpeechBubbleParams): void {
  const bubbleHeight = 20;
  const bubbleY = y - bubbleHeight - 8;
  const maxWidth = size * 3;

  // Medir texto e calcular largura
  ctx.font = "10px 'MedievalSharp', serif";
  const textWidth = Math.min(ctx.measureText(message).width + 12, maxWidth);
  const bubbleWidth = textWidth;
  const bubbleX = x + (size - bubbleWidth) / 2;

  // Truncar texto se muito longo
  let displayText = message;
  if (ctx.measureText(message).width + 12 > maxWidth) {
    while (
      ctx.measureText(displayText + "...").width + 12 > maxWidth &&
      displayText.length > 0
    ) {
      displayText = displayText.slice(0, -1);
    }
    displayText += "...";
  }

  // Fundo do balão
  const bgColor = isOwned ? "#d4af37" : "#dc2626";
  const textColor = isOwned ? "#1a1a1a" : "#ffffff";

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 4);
  ctx.fill();

  // Triângulo apontando para baixo
  ctx.beginPath();
  ctx.moveTo(x + size / 2 - 4, bubbleY + bubbleHeight);
  ctx.lineTo(x + size / 2, bubbleY + bubbleHeight + 6);
  ctx.lineTo(x + size / 2 + 4, bubbleY + bubbleHeight);
  ctx.closePath();
  ctx.fill();

  // Texto
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    displayText,
    bubbleX + bubbleWidth / 2,
    bubbleY + bubbleHeight / 2
  );
}

interface DrawTurnIndicatorParams {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  animationTime: number;
}

/**
 * Desenha indicador de turno ao redor da unidade ativa
 */
export function drawTurnIndicator({
  ctx,
  x,
  y,
  size,
  animationTime,
}: DrawTurnIndicatorParams): void {
  const turnColor = "#10b981"; // Emerald

  // Efeito pulsante
  const pulse = Math.sin(animationTime / 150) * 0.3 + 0.7;

  // Desenhar quadrado ao redor (borda externa)
  ctx.strokeStyle = turnColor;
  ctx.lineWidth = 3;
  ctx.globalAlpha = pulse;
  ctx.strokeRect(x, y, size, size);
  ctx.globalAlpha = 1;

  // Pequeno indicador de diamante acima
  const diamondY = y - 8 + Math.sin(animationTime / 200) * 2;
  ctx.fillStyle = turnColor;
  ctx.beginPath();
  ctx.moveTo(x + size / 2, diamondY);
  ctx.lineTo(x + size / 2 + 4, diamondY + 4);
  ctx.lineTo(x + size / 2, diamondY + 8);
  ctx.lineTo(x + size / 2 - 4, diamondY + 4);
  ctx.closePath();
  ctx.fill();
}
