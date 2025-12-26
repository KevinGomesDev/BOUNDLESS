import Phaser from "phaser";

export class KingdomScene extends Phaser.Scene {
  constructor() {
    super("KingdomScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#2a2a2a");

    this.scene.launch("UIScene");

    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.setActiveTab("kingdom");
    }

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Título
    this.add
      .text(centerX, 100, "👑 MEU REINO 👑", {
        fontSize: "32px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Informações básicas (placeholder)
    const infoStartY = 180;
    const lineHeight = 40;

    const infos = [
      "Nome do Reino: Reino Exemplo",
      "Governante: Jogador",
      "Territórios: 0",
      "População: 0",
      "Ouro: 500 💰",
      "Mana: 100 🔮",
      "",
      "(Sistema de métricas em desenvolvimento)",
    ];

    infos.forEach((text, index) => {
      this.add
        .text(centerX, infoStartY + index * lineHeight, text, {
          fontSize: "18px",
          color: index === infos.length - 1 ? "#666666" : "#ffffff",
        })
        .setOrigin(0.5);
    });
  }
}
