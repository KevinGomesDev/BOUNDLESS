import Phaser from "phaser";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#2b2d42",
  resolution: window.devicePixelRatio || 1,
  antialias: true,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  scene: [MenuScene, GameScene, UIScene],
};

new Phaser.Game(config);
