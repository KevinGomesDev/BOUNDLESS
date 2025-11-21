import Phaser from "phaser";

export class TopBar {
  constructor(scene) {
    this.scene = scene;
    this.width = scene.scale.width;
    this.height = 80; // Altura da barra unificada

    // Containers para organizar elementos
    this.container = scene.add.container(0, 0);
    this.resourceTexts = {}; // Para atualizar valores depois
    this.infoGroup = null; // Para manipular texto da direita

    this.createBackground();
    this.createResourcesArea();
    this.createInfoArea();
  }

  createBackground() {
    const bg = this.scene.add.graphics();

    // Fundo Sólido Escuro
    bg.fillStyle(0x111111, 1);
    bg.fillRect(0, 0, this.width, this.height);

    // Linha de Borda Inferior (Detalhe visual)
    bg.lineStyle(2, 0x444444, 1);
    bg.beginPath();
    bg.moveTo(0, this.height);
    bg.lineTo(this.width, this.height);
    bg.strokePath();

    this.container.add(bg);
  }

  createResourcesArea() {
    // Configuração dos Recursos
    const resources = [
      { key: "gold", icon: "🟡", label: "Ouro", value: 1000 },
      { key: "wood", icon: "🌲", label: "Madeira", value: 500 },
      { key: "food", icon: "🍎", label: "Comida", value: 800 },
      { key: "pop", icon: "👥", label: "Súditos", value: 25 },
    ];

    let startX = 30;
    const gap = 120; // Espaço entre cada recurso

    resources.forEach((res, index) => {
      const xPos = startX + index * gap;
      const yPos = this.height / 2;

      // Texto formatado
      const textObj = this.scene.add
        .text(xPos, yPos, `${res.icon} ${res.value}`, {
          fontFamily: "Arial",
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5); // Centralizado verticalmente

      // Salva referência para atualização futura
      this.resourceTexts[res.key] = textObj;
      this.container.add(textObj);
    });
  }

  createInfoArea() {
    // Área da Direita (Informações do Território)
    const rightMargin = this.width - 30;
    const centerY = this.height / 2;

    // Título Principal (Ex: "Território #42")
    this.infoTitle = this.scene.add
      .text(rightMargin, centerY - 10, "Mundo Aberto", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#e0e0e0",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5); // Alinhado à direita

    // Subtítulo (Ex: "Planícies | Neutro")
    this.infoSubtitle = this.scene.add
      .text(rightMargin, centerY + 15, "Selecione um local", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(1, 0.5); // Alinhado à direita

    this.container.add([this.infoTitle, this.infoSubtitle]);
  }

  // --- MÉTODOS DE ATUALIZAÇÃO ---

  updateTerritoryInfo(data) {
    if (!data) {
      this.infoTitle.setText("Mundo Aberto");
      this.infoTitle.setColor("#e0e0e0");
      this.infoSubtitle.setText("Nenhum território selecionado");
      return;
    }

    if (data.type === "LAND") {
      this.infoTitle.setText(`Território #${data.id} - ${data.terrain.name}`);
      this.infoTitle.setColor("#ffffff");

      const owner =
        data.ownership !== null ? `Jogador ${data.ownership}` : "Neutro";
      const size = data.size || "Padrão";

      this.infoSubtitle.setText(`${size} • ${owner}`);
    } else {
      this.infoTitle.setText("Águas Internacionais");
      this.infoTitle.setColor("#4da6ff");
      this.infoSubtitle.setText("Zona não habitável");
    }
  }

  updateResource(key, newValue) {
    if (this.resourceTexts[key]) {
      // Recupera o ícone original do texto atual para manter
      const currentText = this.resourceTexts[key].text;
      const icon = currentText.split(" ")[0];
      this.resourceTexts[key].setText(`${icon} ${newValue}`);
    }
  }
}
