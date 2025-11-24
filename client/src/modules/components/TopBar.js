import { GameConfig } from "../../config/GameConfig";

export class TopBar {
  constructor(scene) {
    this.scene = scene;
    this.width = scene.scale.width;
    this.height = 80;

    // Container principal da barra (Fixo na tela)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0).setDepth(100);

    this.resourceTexts = {};

    // Container do Tooltip (Camada superior, invisível por padrão)
    this.tooltipContainer = scene.add.container(0, 0);
    this.tooltipContainer.setScrollFactor(0).setDepth(101).setVisible(false);

    this.createBackground();
    this.createResourcesArea();
    this.createInfoArea();
    this.createTooltip(); // Inicializa os gráficos do tooltip
  }

  createBackground() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(GameConfig.UI.COLORS.BAR_BG || 0x111111, 1);
    bg.fillRect(0, 0, this.width, this.height);

    bg.lineStyle(2, 0x444444, 1);
    bg.beginPath();
    bg.moveTo(0, this.height);
    bg.lineTo(this.width, this.height);
    bg.strokePath();

    this.container.add(bg);
  }

  createResourcesArea() {
    // Pega os recursos definidos no GameConfig
    const resources = Object.values(GameConfig.RESOURCES);

    let startX = 30;
    // Calcula o espaço disponível (reservando 400px para a info da direita)
    const availableWidth = this.width - 400 - startX;
    const gap = availableWidth / resources.length;

    resources.forEach((res, index) => {
      const xPos = startX + index * gap;
      const yPos = this.height / 2;

      const textValue = `${res.icon} ${res.startValue}`;

      const textObj = this.scene.add
        .text(xPos, yPos, textValue, {
          fontFamily: "Arial",
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      // Interatividade para o Tooltip
      textObj.setInteractive({ useHandCursor: true });

      textObj.on("pointerover", () => {
        textObj.setColor(res.color); // Muda para a cor do recurso no hover
        this.showTooltip(xPos, this.height + 10, res);
      });

      textObj.on("pointerout", () => {
        textObj.setColor("#ffffff"); // Volta para branco
        this.hideTooltip();
      });

      this.resourceTexts[res.id] = textObj;
      this.container.add(textObj);
    });
  }

  createInfoArea() {
    const rightMargin = this.width - 30;
    const centerY = this.height / 2;

    this.infoTitle = this.scene.add
      .text(rightMargin, centerY - 10, "Mundo Aberto", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#e0e0e0",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);

    this.infoSubtitle = this.scene.add
      .text(rightMargin, centerY + 15, "Selecione um local", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(1, 0.5);

    this.container.add([this.infoTitle, this.infoSubtitle]);
  }

  // --- LÓGICA DE TOOLTIP ---

  createTooltip() {
    this.tooltipBg = this.scene.add.graphics();

    this.tooltipTitle = this.scene.add.text(10, 10, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffaa00",
    });

    this.tooltipDesc = this.scene.add.text(10, 35, "", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#cccccc",
      wordWrap: { width: 350 }, // Quebra de linha automática
    });

    this.tooltipContainer.add([
      this.tooltipBg,
      this.tooltipTitle,
      this.tooltipDesc,
    ]);
  }

  showTooltip(x, y, resourceData) {
    // Preenche os dados
    this.tooltipTitle.setText(`${resourceData.icon} ${resourceData.label}`);
    this.tooltipTitle.setColor(resourceData.color);
    this.tooltipDesc.setText(resourceData.description);

    // Redesenha o fundo baseado no tamanho do texto
    const width = 370; // Largura fixa confortável para leitura
    const height = this.tooltipDesc.height + 50; // Altura dinâmica

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x000000, 0.95);
    this.tooltipBg.lineStyle(1, 0x666666, 1);
    this.tooltipBg.fillRoundedRect(0, 0, width, height, 8);
    this.tooltipBg.strokeRoundedRect(0, 0, width, height, 8);

    // Ajusta posição X se for sair da tela pela direita
    let finalX = x;
    if (finalX + width > this.width) {
      finalX = this.width - width - 10;
    }

    this.tooltipContainer.setPosition(finalX, y);
    this.tooltipContainer.setVisible(true);
  }

  hideTooltip() {
    this.tooltipContainer.setVisible(false);
  }

  // --- ATUALIZAÇÕES ---

  updateResource(key, newValue) {
    if (this.resourceTexts[key]) {
      const currentText = this.resourceTexts[key].text;
      const icon = currentText.split(" ")[0];
      this.resourceTexts[key].setText(`${icon} ${newValue}`);
    }
  }

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

  setCombatState(isActive, territoryName = "", color = 0xffffff) {
    if (isActive) {
      this.infoTitle.setText(`⚔️ COMBATE: ${territoryName.toUpperCase()}`);
      const hexString = "#" + color.toString(16).padStart(6, "0");
      this.infoTitle.setColor(hexString);
      this.infoSubtitle.setText("Modo Tático Ativado");
      this.infoSubtitle.setColor("#ffaa00");
    } else {
      this.updateTerritoryInfo(null);
      this.infoSubtitle.setColor("#888888");
    }
  }
}
