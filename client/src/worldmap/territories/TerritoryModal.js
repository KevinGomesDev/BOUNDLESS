import Phaser from "phaser";
import { InteractiveHexagon } from "./InteractiveHexagon";
import { GridCalculator } from "../../utils/GridCalculator";

export class TerritoryModal {
  constructor(scene) {
    this.scene = scene;
    this.hexagons = [];
    this.selectedHexId = -1;

    // 1. UI Setup
    this.createBackdrop();

    // Container Centralizado
    // IMPORTANTE: setScrollFactor(0) é vital aqui.
    // Como a câmera do jogo se move (pan/zoom), se não travarmos o scroll,
    // o modal abriria na posição 0,0 do mundo e sumiria da tela se você estivesse longe.
    this.container = this.scene.add.container(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2
    );
    this.container.setDepth(21).setVisible(false).setScrollFactor(0);

    this.borderGraphics = this.scene.add.graphics();
    this.container.add(this.borderGraphics);

    // Listener para redimensionamento
    this.scene.scale.on("resize", this.handleResize, this);
  }

  handleResize(gameSize) {
    // Atualiza tamanho e posição do backdrop
    if (this.backdrop) {
      this.backdrop.setSize(gameSize.width, gameSize.height);
      this.backdrop.setPosition(gameSize.width / 2, gameSize.height / 2);
    }

    // Reposiciona container no centro
    if (this.container) {
      this.container.setPosition(gameSize.width / 2, gameSize.height / 2);
    }
  }

  createBackdrop() {
    this.backdrop = this.scene.add.rectangle(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.85 // Opacidade aumentada para melhor contraste
    );

    // Trava o backdrop na tela também
    this.backdrop
      .setOrigin(0.5, 0.5)
      .setDepth(20)
      .setVisible(false)
      .setScrollFactor(0);

    this.backdrop.setInteractive();
    this.backdrop.on("pointerdown", () => {
      // Chama o método de fechar da cena (se existir) ou fecha direto
      if (this.scene.closeModal) {
        this.scene.closeModal();
      } else {
        this.hide();
      }
    });
  }

  /**
   * Exibe o modal com os dados do território
   * @param {Object} territoryData - Objeto vindo do MapRenderer/Backend
   * @param {Object} terrainConfig - Objeto com as cores { FOREST: {color: ...} }
   */
  show(territoryData, terrainConfig) {
    if (!territoryData) return;

    // 1. Parse dos Dados (Adaptação para o Backend Novo)
    // O banco manda polygonData como string "[ [x,y], ... ]"
    let rawPoly;
    try {
      rawPoly =
        typeof territoryData.polygonData === "string"
          ? JSON.parse(territoryData.polygonData)
          : territoryData.polygonData;
    } catch (e) {
      console.error("Erro ao ler polígono:", e);
      return;
    }

    // Atualiza tamanho do backdrop para responsividade
    this.backdrop.setSize(this.scene.scale.width, this.scene.scale.height);
    this.backdrop.setVisible(true);
    this.container.setVisible(true);

    // 2. Preparar Geometria (Normaliza para ocupar 100% da tela)
    const geometry = GridCalculator.normalizePolygon(
      rawPoly,
      this.scene.scale.width,
      this.scene.scale.height,
      1.0 // 100% da tela
    );

    // 3. Desenhar Borda
    this.drawBorder(geometry.points);

    // 4. Definir Quantidade de Hexágonos (Baseado no tamanho do terreno)
    const targetCount = this.determineTerritorySize(territoryData);

    // 5. Gerar Grid Interno
    const gridData = GridCalculator.generateHexPositions(
      geometry.phaserPoly,
      targetCount
    );

    // 6. Definir Cor (Baseado na config recebida)
    let hexColor = 0x888888;
    if (terrainConfig && territoryData.terrainType) {
      const typeData = terrainConfig[territoryData.terrainType];
      if (typeData) hexColor = typeData.color;
    }

    // 7. Criar Componentes Visuais
    this.createHexagons(gridData, hexColor);
  }

  hide() {
    this.backdrop.setVisible(false);
    this.container.setVisible(false);

    // Limpeza
    this.hexagons.forEach((hex) => hex.destroy());
    this.hexagons = [];
    this.borderGraphics.clear();
    this.selectedHexId = -1;
  }

  drawBorder(points) {
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(4, 0xffffff, 0.8);
    this.borderGraphics.beginPath();

    if (points.length > 0) {
      this.borderGraphics.moveTo(points[0].x, points[0].y);
      points.forEach((p) => this.borderGraphics.lineTo(p.x, p.y));
    }

    this.borderGraphics.closePath();
    this.borderGraphics.strokePath();
  }

  createHexagons(gridData, color) {
    let idCounter = 0;

    gridData.positions.forEach((pos) => {
      const hex = new InteractiveHexagon(this.scene, this.container, {
        id: idCounter++,
        x: pos.x,
        y: pos.y,
        radius: gridData.radius,
        color: color,
        onSelect: (id) => this.handleHexSelection(id),
      });

      this.hexagons.push(hex);
    });
  }

  handleHexSelection(newId) {
    if (this.selectedHexId !== -1) {
      const oldHex = this.hexagons.find((h) => h.id === this.selectedHexId);
      if (oldHex) oldHex.setSelected(false);
    }

    this.selectedHexId = newId;
    const newHex = this.hexagons.find((h) => h.id === newId);
    if (newHex) newHex.setSelected(true);

    console.log(`Hex ${newId} selecionado no modal.`);
  }

  determineTerritorySize(data) {
    // O backend manda "Pequeno", "Médio", "Grande" (ou "Vasto" para água)
    const sizeMap = {
      Pequeno: 10,
      Médio: 20,
      Grande: 30,
      Vasto: 5, // Caso clique na água por engano
    };
    return sizeMap[data.size] || 20;
  }
}
