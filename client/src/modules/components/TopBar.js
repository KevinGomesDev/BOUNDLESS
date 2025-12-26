import { GameConfig } from "../../config/GameConfig";

export class TopBar {
  constructor(scene) {
    this.scene = scene;
    this.width = scene.scale.width;

    // Container principal da barra (Fixo na tela)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0).setDepth(100);

    this.resourceTexts = {};
    this.resourceChips = {};
    this.tabs = {};
    this.currentTab = "worldmap";

    // Estilos modernos centralizados
    this.styles = {
      colors: {
        barBg: 0x0f111a,
        barBorder: 0x222632,
        tabDefault: 0x1a1f2b,
        tabHover: 0x232a39,
        tabActive: 0x2b3345,
        tabAccent: 0x4da6ff,
        textPrimary: "#e6eaf2",
        textSecondary: "#9aa3b2",
        chipBg: 0x1a1f2b,
        chipStroke: 0x2e3646,
      },
      spacing: {
        tabsStartX: 16,
        tabsGap: 12,
        tabWidth: 140,
        tabHeight: 36,
        barPaddingX: 16,
        resourceY: 52,
        infoBaseY: 40,
      },
      barHeight: 96,
      radius: 10,
    };

    // Ajusta altura após definir estilos
    this.height = this.styles.barHeight;

    // Estado das abas
    this.tabStates = {
      worldmap: { enabled: true, label: "Mapa Mundi" },
      territory: { enabled: false, label: "Território" },
      battle: { enabled: false, label: "Batalha" },
      kingdom: { enabled: true, label: "Reino" },
    };

    // Container do Tooltip (Camada superior, invisível por padrão)
    this.tooltipContainer = scene.add.container(0, 0);
    this.tooltipContainer.setScrollFactor(0).setDepth(101).setVisible(false);

    this.createBackground();
    this.createTabs();
    this.createResourcesArea();
    this.createInfoArea();
    this.createTooltip(); // Inicializa os gráficos do tooltip

    // Responsividade
    this.scene.scale.on("resize", this.handleResize, this);
  }

  createBackground() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(this.styles.colors.barBg, 1);
    bg.fillRect(0, 0, this.width, this.height);

    // Linha sutil inferior para separar do conteúdo
    bg.lineStyle(1, this.styles.colors.barBorder, 1);
    bg.beginPath();
    bg.moveTo(0, this.height);
    bg.lineTo(this.width, this.height);
    bg.strokePath();

    this.barBg = bg;
    this.container.add(bg);
  }

  createTabs() {
    const tabWidth = this.styles.spacing.tabWidth;
    const tabHeight = this.styles.spacing.tabHeight;
    const startX = this.styles.spacing.tabsStartX;
    const startY = 8;
    const gap = this.styles.spacing.tabsGap;

    const tabOrder = ["worldmap", "territory", "battle", "kingdom"];

    tabOrder.forEach((tabId, index) => {
      const xPos = startX + index * (tabWidth + gap);
      const state = this.tabStates[tabId];

      // Fundo da aba
      const tabBg = this.scene.add.graphics();
      const isActive = this.currentTab === tabId;
      const isEnabled = state.enabled;

      // Cores
      let bgColor = this.styles.colors.tabDefault;
      let alpha = 0.9;

      if (!isEnabled) {
        bgColor = 0x181c25;
        alpha = 0.25;
      } else if (isActive) {
        bgColor = this.styles.colors.tabActive;
        alpha = 1.0;
      }

      tabBg.fillStyle(bgColor, alpha);
      tabBg.fillRoundedRect(
        xPos,
        startY,
        tabWidth,
        tabHeight,
        this.styles.radius
      );

      if (isActive) {
        // Indicador sutil de ativo (underline)
        tabBg.lineStyle(3, this.styles.colors.tabAccent, 1);
        tabBg.beginPath();
        tabBg.moveTo(xPos + 12, startY + tabHeight + 2);
        tabBg.lineTo(xPos + tabWidth - 12, startY + tabHeight + 2);
        tabBg.strokePath();
      }

      // Texto da aba
      const textColor = !isEnabled
        ? "#6b7280"
        : isActive
        ? this.styles.colors.textPrimary
        : this.styles.colors.textSecondary;

      const tabText = this.scene.add
        .text(xPos + tabWidth / 2, startY + tabHeight / 2, state.label, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: textColor,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      // Área interativa
      const hitArea = this.scene.add.rectangle(
        xPos + tabWidth / 2,
        startY + tabHeight / 2,
        tabWidth,
        tabHeight,
        0x000000,
        0.01
      );

      hitArea.setInteractive({ useHandCursor: isEnabled });

      if (isEnabled) {
        hitArea.on("pointerover", () => {
          if (this.currentTab !== tabId) {
            tabBg.clear();
            tabBg.fillStyle(this.styles.colors.tabHover, 0.95);
            tabBg.fillRoundedRect(
              xPos,
              startY,
              tabWidth,
              tabHeight,
              this.styles.radius
            );
            tabText.setColor(this.styles.colors.textPrimary);
          }
        });

        hitArea.on("pointerout", () => {
          if (this.currentTab !== tabId) {
            tabBg.clear();
            tabBg.fillStyle(this.styles.colors.tabDefault, 0.9);
            tabBg.fillRoundedRect(
              xPos,
              startY,
              tabWidth,
              tabHeight,
              this.styles.radius
            );
            tabText.setColor(this.styles.colors.textSecondary);
          }
        });

        hitArea.on("pointerdown", () => {
          this.switchTab(tabId);
        });
      }

      this.tabs[tabId] = { bg: tabBg, text: tabText, hitArea: hitArea };
      this.container.add([tabBg, tabText, hitArea]);
    });
  }

  switchTab(tabId) {
    if (!this.tabStates[tabId].enabled || this.currentTab === tabId) return;

    this.currentTab = tabId;

    // Atualiza visual das abas
    this.refreshTabs();

    // Troca de cena
    const sceneMap = {
      worldmap: "GameScene",
      territory: "TerritoryScene",
      battle: "BattleScene",
      kingdom: "KingdomScene",
    };

    const targetScene = sceneMap[tabId];
    if (targetScene) {
      // Prepara dados para a cena de território
      let sceneData = {};
      if (tabId === "territory") {
        sceneData = {
          territory: this.scene.game.registry.get("selectedTerritory"),
          terrainConfig: this.scene.game.registry.get("terrainConfig"),
        };
      }

      // Para a cena atual e inicia a nova
      const currentScene = this.scene.scene.key;
      if (currentScene !== "UIScene") {
        this.scene.scene.start(targetScene, sceneData);
      }
    }
  }

  refreshTabs() {
    const tabWidth = this.styles.spacing.tabWidth;
    const tabHeight = this.styles.spacing.tabHeight;
    const startX = this.styles.spacing.tabsStartX;
    const startY = 8;
    const gap = this.styles.spacing.tabsGap;

    const tabOrder = ["worldmap", "territory", "battle", "kingdom"];

    tabOrder.forEach((tabId, index) => {
      const xPos = startX + index * (tabWidth + gap);
      const state = this.tabStates[tabId];
      const tab = this.tabs[tabId];

      if (!tab) return;

      const isActive = this.currentTab === tabId;
      const isEnabled = state.enabled;

      // Redesenha fundo
      tab.bg.clear();

      let bgColor = this.styles.colors.tabDefault;
      let alpha = 0.9;

      if (!isEnabled) {
        bgColor = 0x181c25;
        alpha = 0.25;
      } else if (isActive) {
        bgColor = this.styles.colors.tabActive;
        alpha = 1.0;
      }

      tab.bg.fillStyle(bgColor, alpha);
      tab.bg.fillRoundedRect(
        xPos,
        startY,
        tabWidth,
        tabHeight,
        this.styles.radius
      );

      if (isActive) {
        tab.bg.lineStyle(3, this.styles.colors.tabAccent, 1);
        tab.bg.beginPath();
        tab.bg.moveTo(xPos + 12, startY + tabHeight + 2);
        tab.bg.lineTo(xPos + tabWidth - 12, startY + tabHeight + 2);
        tab.bg.strokePath();
      }

      // Atualiza cor do texto
      const textColor = !isEnabled
        ? "#6b7280"
        : isActive
        ? this.styles.colors.textPrimary
        : this.styles.colors.textSecondary;
      tab.text.setColor(textColor);

      // Atualiza interatividade
      tab.hitArea.removeAllListeners();

      if (isEnabled) {
        tab.hitArea.setInteractive({ useHandCursor: true });

        tab.hitArea.on("pointerover", () => {
          if (this.currentTab !== tabId) {
            tab.bg.clear();
            tab.bg.fillStyle(this.styles.colors.tabHover, 0.95);
            tab.bg.fillRoundedRect(
              xPos,
              startY,
              tabWidth,
              tabHeight,
              this.styles.radius
            );
            tab.text.setColor(this.styles.colors.textPrimary);
          }
        });

        tab.hitArea.on("pointerout", () => {
          if (this.currentTab !== tabId) {
            tab.bg.clear();
            tab.bg.fillStyle(this.styles.colors.tabDefault, 0.9);
            tab.bg.fillRoundedRect(
              xPos,
              startY,
              tabWidth,
              tabHeight,
              this.styles.radius
            );
            tab.text.setColor(this.styles.colors.textSecondary);
          }
        });

        tab.hitArea.on("pointerdown", () => {
          this.switchTab(tabId);
        });
      } else {
        tab.hitArea.disableInteractive();
      }
    });
  }

  setTabEnabled(tabId, enabled) {
    if (this.tabStates[tabId]) {
      this.tabStates[tabId].enabled = enabled;
      this.refreshTabs();
    }
  }

  setActiveTab(tabId) {
    if (this.tabStates[tabId]) {
      this.currentTab = tabId;
      this.refreshTabs();
    }
  }

  createResourcesArea() {
    const resources = Object.values(GameConfig.RESOURCES);

    // Layout: calcula início após as abas
    const tabsWidth =
      this.styles.spacing.tabsStartX +
      4 * (this.styles.spacing.tabWidth + this.styles.spacing.tabsGap);

    const startX = tabsWidth + 24;
    const startY = this.styles.spacing.resourceY;

    const rightReserved = 380; // espaço para info à direita
    const availableWidth = Math.max(this.width - rightReserved - startX, 300);
    const chipWidth = Math.floor(availableWidth / resources.length) - 12;
    const chipHeight = 28;

    resources.forEach((res, index) => {
      const xPos = startX + index * (chipWidth + 12);

      const bg = this.scene.add.graphics();
      bg.fillStyle(this.styles.colors.chipBg, 0.95);
      bg.lineStyle(1, this.styles.colors.chipStroke, 1);
      bg.fillRoundedRect(
        xPos,
        startY - chipHeight / 2,
        chipWidth,
        chipHeight,
        this.styles.radius - 4
      );
      bg.strokeRoundedRect(
        xPos,
        startY - chipHeight / 2,
        chipWidth,
        chipHeight,
        this.styles.radius - 4
      );

      const iconText = this.scene.add
        .text(xPos + 10, startY, res.icon, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: this.styles.colors.textSecondary,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      const valueText = this.scene.add
        .text(xPos + 34, startY, `${res.startValue}`, {
          fontFamily: "Arial",
          fontSize: "14px",
          color: this.styles.colors.textPrimary,
          fontStyle: "bold",
        })
        .setOrigin(0, 0.5);

      const hitArea = this.scene.add.rectangle(
        xPos + chipWidth / 2,
        startY,
        chipWidth,
        chipHeight,
        0x000000,
        0.01
      );

      hitArea.setInteractive({ useHandCursor: true });

      hitArea.on("pointerover", () => {
        bg.clear();
        bg.fillStyle(this.styles.colors.tabHover, 0.95);
        bg.lineStyle(1, this.styles.colors.chipStroke, 1);
        bg.fillRoundedRect(
          xPos,
          startY - chipHeight / 2,
          chipWidth,
          chipHeight,
          this.styles.radius - 4
        );
        bg.strokeRoundedRect(
          xPos,
          startY - chipHeight / 2,
          chipWidth,
          chipHeight,
          this.styles.radius - 4
        );
        this.showTooltip(xPos, this.height + 10, res);
      });

      hitArea.on("pointerout", () => {
        bg.clear();
        bg.fillStyle(this.styles.colors.chipBg, 0.95);
        bg.lineStyle(1, this.styles.colors.chipStroke, 1);
        bg.fillRoundedRect(
          xPos,
          startY - chipHeight / 2,
          chipWidth,
          chipHeight,
          this.styles.radius - 4
        );
        bg.strokeRoundedRect(
          xPos,
          startY - chipHeight / 2,
          chipWidth,
          chipHeight,
          this.styles.radius - 4
        );
        this.hideTooltip();
      });

      this.resourceChips[res.id] = {
        bg,
        iconText,
        valueText,
        hitArea,
        xPos,
        chipWidth,
        chipHeight,
      };
      this.container.add([bg, iconText, valueText, hitArea]);
    });
  }

  createInfoArea() {
    const rightMargin = this.width - 24;
    const baseY = this.styles.spacing.infoBaseY; // base do bloco de info

    // Bloco: Hover
    this.hoverTitle = this.scene.add
      .text(rightMargin, baseY - 6, "Hover: Selecione um local", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: this.styles.colors.textPrimary,
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);

    this.hoverSubtitle = this.scene.add
      .text(rightMargin, baseY + 10, "Passe o cursor sobre um território", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: this.styles.colors.textSecondary,
      })
      .setOrigin(1, 0.5);

    // Bloco: Selecionado
    this.selectedTitle = this.scene.add
      .text(rightMargin, baseY + 30, "Selecionado: Nenhum território", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: this.styles.colors.textPrimary,
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);

    this.selectedSubtitle = this.scene.add
      .text(rightMargin, baseY + 48, "Clique para selecionar um território", {
        fontFamily: "Arial",
        fontSize: "12px",
        color: this.styles.colors.textSecondary,
      })
      .setOrigin(1, 0.5);

    this.container.add([
      this.hoverTitle,
      this.hoverSubtitle,
      this.selectedTitle,
      this.selectedSubtitle,
    ]);
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
    const chip = this.resourceChips[key];
    if (chip) {
      chip.valueText.setText(`${newValue}`);
    }
  }

  // --- INFO: HOVER ---
  updateHoveredInfo(data) {
    if (!data) {
      this.hoverTitle.setText("Hover: Selecione um local");
      this.hoverTitle.setColor(this.styles.colors.textPrimary);
      this.hoverSubtitle.setText("Passe o cursor sobre um território");
      this.hoverSubtitle.setColor(this.styles.colors.textSecondary);
      return;
    }

    if (data.type === "LAND") {
      const name = data.terrainName || "Terra Desconhecida";
      this.hoverTitle.setText(`Hover: Território #${data.mapIndex} - ${name}`);
      this.hoverTitle.setColor(this.styles.colors.textPrimary);

      const owner = data.ownerId ? "Ocupado" : "Neutro";
      const size = data.size || "Padrão";
      this.hoverSubtitle.setText(`Tamanho: ${size} • Controle: ${owner}`);
      this.hoverSubtitle.setColor(this.styles.colors.textSecondary);
    } else {
      this.hoverTitle.setText("Hover: Águas Internacionais");
      this.hoverTitle.setColor("#4da6ff");
      this.hoverSubtitle.setText("Zona não navegável");
      this.hoverSubtitle.setColor(this.styles.colors.textSecondary);
    }
  }

  // --- INFO: SELECIONADO ---
  updateSelectedInfo(data) {
    if (!data) {
      this.selectedTitle.setText("Selecionado: Nenhum território");
      this.selectedTitle.setColor(this.styles.colors.textPrimary);
      this.selectedSubtitle.setText("Clique para selecionar um território");
      this.selectedSubtitle.setColor(this.styles.colors.textSecondary);
      return;
    }

    if (data.type === "LAND") {
      const name = data.terrainName || "Terra Desconhecida";
      this.selectedTitle.setText(
        `Selecionado: Território #${data.mapIndex} - ${name}`
      );
      this.selectedTitle.setColor(this.styles.colors.textPrimary);

      const owner = data.ownerId ? "Ocupado" : "Neutro";
      const size = data.size || "Padrão";
      this.selectedSubtitle.setText(`Tamanho: ${size} • Controle: ${owner}`);
      this.selectedSubtitle.setColor(this.styles.colors.textSecondary);
    } else {
      this.selectedTitle.setText("Selecionado: Águas Internacionais");
      this.selectedTitle.setColor("#4da6ff");
      this.selectedSubtitle.setText("Zona não navegável");
      this.selectedSubtitle.setColor(this.styles.colors.textSecondary);
    }
  }

  setCombatState(isActive, territoryName = "", color = 0xffffff) {
    if (isActive) {
      this.selectedTitle.setText(`⚔️ COMBATE: ${territoryName.toUpperCase()}`);
      const hexString = "#" + color.toString(16).padStart(6, "0");
      this.selectedTitle.setColor(hexString);
      this.selectedSubtitle.setText("Modo Tático Ativado");
      this.selectedSubtitle.setColor("#ffaa00");
    } else {
      this.updateSelectedInfo(null);
      this.selectedSubtitle.setColor(this.styles.colors.textSecondary);
    }
  }

  handleResize(gameSize) {
    const width = gameSize.width;
    this.width = width;
    this.height = this.styles.barHeight;

    // Redesenha o fundo
    if (this.barBg) {
      this.barBg.clear();
      this.barBg.fillStyle(this.styles.colors.barBg, 1);
      this.barBg.fillRect(0, 0, this.width, this.height);
      this.barBg.lineStyle(1, this.styles.colors.barBorder, 1);
      this.barBg.beginPath();
      this.barBg.moveTo(0, this.height);
      this.barBg.lineTo(this.width, this.height);
      this.barBg.strokePath();
    }

    // Reposiciona abas
    this.refreshTabs();

    // Recria área de recursos para ajustar layout
    // Remove recursos antigos
    Object.values(this.resourceChips).forEach((c) => {
      c.bg.destroy();
      c.iconText.destroy();
      c.valueText.destroy();
      c.hitArea.destroy();
    });
    this.resourceChips = {};
    this.createResourcesArea();

    // Reposiciona área de informações (hover + selecionado)
    const rightMargin = this.width - 24;
    const baseY = this.styles.spacing.infoBaseY;
    if (
      this.hoverTitle &&
      this.hoverSubtitle &&
      this.selectedTitle &&
      this.selectedSubtitle
    ) {
      this.hoverTitle.setPosition(rightMargin, baseY - 6);
      this.hoverSubtitle.setPosition(rightMargin, baseY + 10);
      this.selectedTitle.setPosition(rightMargin, baseY + 30);
      this.selectedSubtitle.setPosition(rightMargin, baseY + 48);
    }
  }
}
