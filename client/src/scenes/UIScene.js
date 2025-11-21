import Phaser from "phaser";

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });

    // Elementos de Texto para Info do Território
    this.infoTitle = null;
    this.infoDetail = null;
    this.closeModalBtn = null;
  }

  create() {
    const width = this.scale.width;

    // --- CONFIGURAÇÃO DE LAYOUT (HEADER) ---
    const HEADER_HEIGHT = 100;
    const RES_BAR_HEIGHT = 40;
    const INFO_BAR_HEIGHT = 60;

    // 1. FAIXA DE RECURSOS (Topo - Escura)
    const resGraphics = this.add.graphics();
    resGraphics.fillStyle(0x1a1a1a, 1);
    resGraphics.fillRect(0, 0, width, RES_BAR_HEIGHT);

    this.createResourceItem(20, 10, "🟡", "Ouro", "1000");
    this.createResourceItem(150, 10, "🌲", "Madeira", "500");
    this.createResourceItem(280, 10, "🍎", "Comida", "800");
    this.createResourceItem(410, 10, "👥", "Súditos", "25");

    // 2. FAIXA DE INFO (Abaixo - Cinza Médio)
    const infoGraphics = this.add.graphics();
    infoGraphics.fillStyle(0x333333, 1);
    infoGraphics.fillRect(0, RES_BAR_HEIGHT, width, INFO_BAR_HEIGHT);

    // Linha divisória final do HUD
    infoGraphics.lineStyle(2, 0x000000, 1);
    infoGraphics.beginPath();
    infoGraphics.moveTo(0, HEADER_HEIGHT);
    infoGraphics.lineTo(width, HEADER_HEIGHT);
    infoGraphics.strokePath();

    // 3. ÁREA DE INFORMAÇÃO (Lado Direito)
    const infoX = width - 400;

    // Divisória visual
    const sepGraphics = this.add.graphics();
    sepGraphics.lineStyle(2, 0x555555, 1);
    sepGraphics.lineBetween(
      infoX - 20,
      RES_BAR_HEIGHT + 5,
      infoX - 20,
      HEADER_HEIGHT - 5
    );

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

  createResourceItem(x, y, icon, label, value) {
    this.add.text(x, y, `${icon} ${value}`, {
      fontSize: "16px",
      color: "#e0e0e0",
      fontStyle: "bold",
    });
  }

  setModalState(isOpen) {
    this.closeModalBtn.setVisible(isOpen);
  }

  updateInfo(data) {
    if (data && data.type === "LAND") {
      this.infoTitle.setText(`Território #${data.id} - ${data.terrain.name}`);
      this.infoTitle.setColor("#ffffff");

      const owner =
        data.ownership !== null ? `Jogador ${data.ownership}` : "Neutro";
      const explored = data.explored ? "Sim" : "Não";

      this.infoDetail.setText(
        `Tamanho: ${data.size}\n` + `Dono: ${owner} | Explorado: ${explored}`
      );
    } else {
      this.infoTitle.setText("Nenhum Selecionado");
      this.infoTitle.setColor("#aaaaaa");
      this.infoDetail.setText("Clique no mapa para ver detalhes.");
    }
  }
}
