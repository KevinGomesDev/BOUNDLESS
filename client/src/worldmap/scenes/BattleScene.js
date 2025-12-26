import Phaser from "phaser";

export class BattleScene extends Phaser.Scene {
  constructor() {
    super("BattleScene");
  }

  init(data) {
    this.battleData = data;
  }

  create() {
    this.cameras.main.setBackgroundColor("#1a1a1a");

    this.scene.launch("UIScene");

    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.setCombatMode(true, { terrainName: "Batalha Ativa" });
      uiScene.setActiveTab("battle");
      uiScene.setTabEnabled("battle", true);
    }

    // Placeholder para sistema de batalha
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add
      .text(centerX, centerY - 50, "⚔️ MODO BATALHA ⚔️", {
        fontSize: "32px",
        color: "#ff4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 20, "Sistema de combate em desenvolvimento", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 60, "(Use a aba Mapa Mundi para voltar)", {
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);
  }

  shutdown() {
    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.setCombatMode(false);
    }
  }
}
