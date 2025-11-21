import Phaser from "phaser";

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });

    this.resourcesText = {};
    this.viewTabs = {};
    this.currentView = "STRATEGY";
    this.infoTitle = null;
    this.infoDetail = null;
  }

  create() {
    const width = this.scale.width;

    // --- CONFIGURAÇÃO DE LAYOUT (HEADER) ---
    const HEADER_HEIGHT = 100;
    const RES_BAR_HEIGHT = 40; // Faixa preta de recursos
    const TAB_BAR_HEIGHT = 60; // Faixa cinza de abas/info

    // 1. FAIXA DE RECURSOS (Topo - Escura)
    const resGraphics = this.add.graphics();
    resGraphics.fillStyle(0x1a1a1a, 1);
    resGraphics.fillRect(0, 0, width, RES_BAR_HEIGHT);

    // Mock de Recursos
    this.createResourceItem(20, 10, "🟡", "Ouro", "1000");
    this.createResourceItem(150, 10, "🌲", "Madeira", "500");
    this.createResourceItem(280, 10, "🍎", "Comida", "800");
    this.createResourceItem(410, 10, "👥", "Súditos", "25");

    // 2. FAIXA DE VISÃO E INFO (Abaixo - Cinza Médio)
    const tabGraphics = this.add.graphics();
    tabGraphics.fillStyle(0x333333, 1);
    tabGraphics.fillRect(0, RES_BAR_HEIGHT, width, TAB_BAR_HEIGHT);

    // Linha divisória final do HUD
    tabGraphics.lineStyle(2, 0x000000, 1);
    tabGraphics.beginPath();
    tabGraphics.moveTo(0, HEADER_HEIGHT);
    tabGraphics.lineTo(width, HEADER_HEIGHT);
    tabGraphics.strokePath();

    // 3. ABAS (Lado Esquerdo da faixa de baixo)
    this.createTabButton(
      10,
      RES_BAR_HEIGHT + 10,
      "ESTRATÉGIA",
      "STRATEGY",
      true
    );
    this.createTabButton(
      150,
      RES_BAR_HEIGHT + 10,
      "TERRITÓRIO",
      "TERRITORY",
      false
    );
    this.createTabButton(290, RES_BAR_HEIGHT + 10, "COMBATE", "COMBAT", false);

    // 4. ÁREA DE INFORMAÇÃO (Lado Direito da faixa de baixo)
    // Aqui mostramos o que foi selecionado
    const infoX = width - 400; // Começa a 400px do fim

    // Divisória visual para separar abas das infos
    const sepGraphics = this.add.graphics();
    sepGraphics.lineStyle(2, 0x555555, 1);
    sepGraphics.lineBetween(
      infoX - 20,
      RES_BAR_HEIGHT + 5,
      infoX - 20,
      HEADER_HEIGHT - 5
    );

    // Textos de Info
    this.infoTitle = this.add.text(
      infoX,
      RES_BAR_HEIGHT + 8,
      "Nenhum Selecionado",
      {
        fontSize: "18px",
        color: "#e0e0e0",
        fontStyle: "bold",
      }
    );

    this.infoDetail = this.add.text(
      infoX,
      RES_BAR_HEIGHT + 30,
      "Clique no mapa para detalhes.",
      {
        fontSize: "14px",
        color: "#aaaaaa",
      }
    );
  }

  // --- MÉTODOS AUXILIARES ---

  createResourceItem(x, y, icon, label, value) {
    this.add.text(x, y, `${icon} ${value}`, {
      fontSize: "16px",
      color: "#e0e0e0",
      fontStyle: "bold",
    });
  }

  createTabButton(x, y, label, viewName, isActive) {
    const btnWidth = 130;
    const btnHeight = 40;
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(
      0,
      0,
      btnWidth,
      btnHeight,
      isActive ? 0x457b9d : 0x555555
    );
    bg.setOrigin(0, 0);
    bg.setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(1, 0x000000);

    const text = this.add
      .text(btnWidth / 2, btnHeight / 2, label, {
        fontSize: "14px",
        color: isActive ? "#ffffff" : "#aaaaaa",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    container.add([bg, text]);

    bg.on("pointerdown", () => {
      this.changeView(viewName, bg, text);
    });

    this.viewTabs[viewName] = { bg, text };
  }

  changeView(newView, bgObj, textObj) {
    if (newView === "COMBAT") return;

    this.currentView = newView;

    Object.values(this.viewTabs).forEach((tab) => {
      tab.bg.setFillStyle(0x555555);
      tab.text.setColor("#aaaaaa");
    });

    bgObj.setFillStyle(0x457b9d);
    textObj.setColor("#ffffff");

    const gameScene = this.scene.get("GameScene");
    if (gameScene) {
      gameScene.events.emit("CHANGE_VIEW", newView);
    }
  }

  // --- AQUI ESTÁ A CORREÇÃO DO HUD DE INFO ---
  updateInfo(data) {
    if (data && data.type === "LAND") {
      this.infoTitle.setText(`Território #${data.id} - ${data.terrain.name}`);
      this.infoTitle.setColor("#ffffff");
      this.infoDetail.setText(`Status: Neutro | Defesa: 0%`);
    } else {
      this.infoTitle.setText("Nenhum Selecionado");
      this.infoTitle.setColor("#aaaaaa");
      this.infoDetail.setText("Clique no mapa para ver detalhes.");
    }
  }
}
