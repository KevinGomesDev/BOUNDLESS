import React, { useEffect, useRef } from "react";
import {
  HERO_IDS,
  TOTAL_HEROES,
  ANIMATION_CONFIGS,
  FRAME_SIZE,
  getAnimationPath,
  parseAvatarToHeroId,
  heroIdToAvatarString,
  type SpriteAnimation,
  type SpriteDirection,
} from "../../../arena/components/canvas";

// Re-export para uso externo
export { HERO_IDS, TOTAL_HEROES, parseAvatarToHeroId, heroIdToAvatarString };
export type { SpriteAnimation, SpriteDirection };

interface AnimatedCharacterSpriteProps {
  /** ID do herói (1-15) */
  heroId: number;
  /** Tamanho do sprite em pixels */
  size?: number;
  /** Animação a exibir */
  animation?: SpriteAnimation;
  /** Direção do sprite (left = espelhado) */
  direction?: SpriteDirection;
  /** Classes CSS adicionais */
  className?: string;
  /** Callback quando animação não-loop termina */
  onAnimationEnd?: () => void;
}

/**
 * Componente unificado para exibir sprites de personagens animados.
 * ÚNICO componente responsável por renderizar personagens em toda a aplicação.
 *
 * Usado em:
 * - Seletor de avatar (criação de reino/tropas)
 * - Canvas de batalha
 * - Qualquer outro lugar que precise exibir personagens
 */
export const AnimatedCharacterSprite: React.FC<
  AnimatedCharacterSpriteProps
> = ({
  heroId,
  size = 64,
  animation = "Idle",
  direction = "right",
  className = "",
  onAnimationEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadedPathRef = useRef<string>("");
  const lastFrameTimeRef = useRef(0);
  const animationEndCalledRef = useRef(false);

  const config = ANIMATION_CONFIGS[animation];
  const { frameCount, frameDuration, loop } = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calcular caminho do sprite
    const spritePath = getAnimationPath(heroId, animation);

    // Recarregar se mudou o sprite
    if (loadedPathRef.current !== spritePath) {
      const img = new Image();
      img.src = spritePath;
      imageRef.current = img;
      loadedPathRef.current = spritePath;
      frameRef.current = 0;
      animationEndCalledRef.current = false;
    }

    const img = imageRef.current;
    if (!img) return;

    let animationId: number;

    const draw = (timestamp: number) => {
      if (!ctx || !img.complete) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Atualizar frame baseado no tempo
      if (timestamp - lastFrameTimeRef.current >= frameDuration) {
        const nextFrame = frameRef.current + 1;

        if (nextFrame >= frameCount) {
          if (loop) {
            frameRef.current = 0;
          } else {
            // Manter no último frame
            frameRef.current = frameCount - 1;
            // Chamar callback de fim de animação
            if (!animationEndCalledRef.current) {
              animationEndCalledRef.current = true;
              onAnimationEnd?.();
            }
          }
        } else {
          frameRef.current = nextFrame;
        }

        lastFrameTimeRef.current = timestamp;
      }

      // Limpar canvas
      ctx.clearRect(0, 0, size, size);

      // Calcular posição no sprite sheet (frames horizontais)
      const srcX = frameRef.current * FRAME_SIZE;
      const srcY = 0;

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Aplicar flip se direção é esquerda
      if (direction === "left") {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(img, srcX, srcY, FRAME_SIZE, FRAME_SIZE, 0, 0, size, size);

      ctx.restore();

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    heroId,
    size,
    animation,
    direction,
    frameCount,
    frameDuration,
    loop,
    onAnimationEnd,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
};

interface AvatarSelectorProps {
  /** Avatar selecionado atualmente (heroId como string "1"-"15") */
  selectedAvatar: string;
  /** Callback quando avatar muda */
  onSelectAvatar: (avatarId: string) => void;
  /** Tamanho do sprite exibido */
  spriteSize?: number;
  /** Título do seletor */
  title?: string;
}

/**
 * Seletor de avatar genérico com setas para navegar entre sprites animados
 * Usa os novos sprites Hero_001 a Hero_015
 */
export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelectAvatar,
  spriteSize = 128,
  title = "Aparência",
}) => {
  // Converter avatar para heroId
  const currentHeroId = parseAvatarToHeroId(selectedAvatar);
  const currentIndex = HERO_IDS.indexOf(currentHeroId);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;

  const goToPrev = () => {
    const newIndex = (validIndex - 1 + HERO_IDS.length) % HERO_IDS.length;
    onSelectAvatar(heroIdToAvatarString(HERO_IDS[newIndex]));
  };

  const goToNext = () => {
    const newIndex = (validIndex + 1) % HERO_IDS.length;
    onSelectAvatar(heroIdToAvatarString(HERO_IDS[newIndex]));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Título */}
      <label className="text-sm font-semibold text-white">{title}</label>

      {/* Sprite animado com setas */}
      <div className="relative flex items-center gap-4">
        {/* Seta esquerda */}
        <button
          type="button"
          onClick={goToPrev}
          className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/70 text-white transition-all
                     hover:scale-110 active:scale-95 border border-slate-500/30"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Container do sprite */}
        <div
          className="relative rounded-xl overflow-hidden bg-slate-900/80 border border-slate-600"
          style={{ width: spriteSize + 16, height: spriteSize + 16 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedCharacterSprite
              heroId={HERO_IDS[validIndex]}
              size={spriteSize}
              animation="Idle"
            />
          </div>
        </div>

        {/* Seta direita */}
        <button
          type="button"
          onClick={goToNext}
          className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/70 text-white transition-all
                     hover:scale-110 active:scale-95 border border-slate-500/30"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Contador */}
      <p className="text-xs text-slate-400">
        {validIndex + 1} / {HERO_IDS.length}
      </p>
    </div>
  );
};

/**
 * Seletor de avatar compacto (grid de miniaturas)
 */
interface AvatarGridSelectorProps {
  /** Avatar selecionado atualmente */
  selectedAvatar: string;
  /** Callback quando avatar muda */
  onSelectAvatar: (avatarId: string) => void;
  /** Número de colunas no grid */
  columns?: number;
  /** Tamanho de cada miniatura */
  thumbnailSize?: number;
}

export const AvatarGridSelector: React.FC<AvatarGridSelectorProps> = ({
  selectedAvatar,
  onSelectAvatar,
  columns = 5,
  thumbnailSize = 48,
}) => {
  const currentHeroId = parseAvatarToHeroId(selectedAvatar);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {HERO_IDS.map((heroId) => (
        <button
          key={heroId}
          type="button"
          onClick={() => onSelectAvatar(heroIdToAvatarString(heroId))}
          className={`p-1 rounded border-2 transition-all ${
            currentHeroId === heroId
              ? "border-amber-500 bg-amber-500/20"
              : "border-slate-600 hover:border-slate-500"
          }`}
        >
          <AnimatedCharacterSprite
            heroId={heroId}
            size={thumbnailSize}
            animation="Idle"
          />
        </button>
      ))}
    </div>
  );
};
