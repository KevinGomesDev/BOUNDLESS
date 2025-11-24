import Phaser from "phaser";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { KingdomsScene } from "./scenes/KingdomsScene";
import { KingdomCreationScene } from "./scenes/KingdomCreationScene.js";
import { EntryScene } from "./scenes/EntryScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { MatchBrowserScene } from "./scenes/MatchBrowserScene";
import socketService from "./services/SocketService"; // <--- Importe o serviço

// Inicia a conexão com o servidor Socket.io
socketService.connect();

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

  scene: [
    EntryScene,
    MenuScene,
    KingdomsScene,
    KingdomCreationScene,
    GameScene,
    UIScene,
    LobbyScene,
    MatchBrowserScene,
  ],
};

new Phaser.Game(config);
