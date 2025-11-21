import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#2b2d42",

  // --- CONFIGURAÇÕES DE NITIDEZ ---
  // 1. Usa a densidade real de pixels do monitor (ex: telas Retina/4K ficam em 2x ou mais)
  resolution: window.devicePixelRatio || 1,

  // 2. Antialias ajuda nas formas geométricas do mapa (Voronoi)
  antialias: true,

  // 3. CRÍTICO: roundPixels FORÇA o desenho em coordenadas inteiras (ex: 10px em vez de 10.4px).
  // Isso remove o "borrão" de meio-pixel, essencial para TEXTOS e UI nítidos.
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [GameScene, UIScene],
};

new Phaser.Game(config);
