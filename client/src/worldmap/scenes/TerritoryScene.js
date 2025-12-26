import Phaser from "phaser";
import { InteractiveHexagon } from "../territories/InteractiveHexagon";
import { GridCalculator } from "../../utils/GridCalculator";

export class TerritoryScene extends Phaser.Scene {
  constructor() {
    super("TerritoryScene");
    this.hexagons = [];
    this.selectedHexId = -1;
    this.territoryData = null;
    this.terrainConfig = null;
  }

  init(data) {
    // Pega do data passado ou do registry como fallback
    this.territoryData =
      data?.territory || this.registry.get("selectedTerritory");
    this.terrainConfig =
      data?.terrainConfig || this.registry.get("terrainConfig");
  }

  create() {
    this.cameras.main.setBackgroundColor("#457b9d");

    this.scene.launch("UIScene");

    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      uiScene.updateSelectedTerritoryInfo(this.territoryData);
      uiScene.setActiveTab("territory");
      uiScene.setTabEnabled("territory", true);
    }

    // Container para os hexágonos
    this.container = this.add.container(
      this.scale.width / 2,
      this.scale.height / 2
    );

    this.borderGraphics = this.add.graphics();
    this.container.add(this.borderGraphics);

    // Desenha o território
    this.drawTerritory();

    // Listener para redimensionamento
    this.scale.on("resize", this.handleResize, this);
  }

  drawTerritory() {
    if (!this.territoryData) return;

    // Parse dos dados do polígono
    let rawPoly;
    try {
      rawPoly =
        typeof this.territoryData.polygonData === "string"
          ? JSON.parse(this.territoryData.polygonData)
          : this.territoryData.polygonData;
    } catch (e) {
      console.error("Erro ao ler polígono:", e);
      return;
    }

    // Normaliza para ocupar 100% da tela
    const geometry = GridCalculator.normalizePolygon(
      rawPoly,
      this.scale.width,
      this.scale.height,
      1.0
    );

    // Desenha borda
    this.drawBorder(geometry.points);

    // Define quantidade de hexágonos
    const targetCount = this.determineTerritorySize(this.territoryData);

    // Gera grid interno
    const gridData = GridCalculator.generateHexPositions(
      geometry.phaserPoly,
      targetCount
    );

    // Define cor baseada no terreno
    let hexColor = 0x888888;
    if (this.terrainConfig && this.territoryData.terrainType) {
      const typeData = this.terrainConfig[this.territoryData.terrainType];
      if (typeData) hexColor = typeData.color;
    }

    // Cria hexágonos
    this.createHexagons(gridData, hexColor);
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
      const hex = new InteractiveHexagon(this, this.container, {
        id: idCounter++,
        x: pos.x,
        y: pos.y,
        size: gridData.hexSize,
        fillColor: color,
        onSelect: (id) => this.handleHexSelection(id),
      });

      this.hexagons.push(hex);
    });
  }

  handleHexSelection(newId) {
    // Desmarca o anterior
    if (this.selectedHexId !== -1) {
      const oldHex = this.hexagons.find((h) => h.id === this.selectedHexId);
      if (oldHex) oldHex.deselect();
    }

    // Marca o novo
    this.selectedHexId = newId;
    const newHex = this.hexagons.find((h) => h.id === newId);
    if (newHex) newHex.select();
  }

  determineTerritorySize(data) {
    const sizeMap = { SMALL: 20, MEDIUM: 40, LARGE: 60 };
    return sizeMap[data.size] || 30;
  }

  handleResize(gameSize) {
    this.container.setPosition(gameSize.width / 2, gameSize.height / 2);

    // Redesenha o território com novo tamanho
    this.hexagons.forEach((hex) => hex.destroy());
    this.hexagons = [];
    this.borderGraphics.clear();
    this.drawTerritory();
  }

  shutdown() {
    this.scale.off("resize", this.handleResize, this);
    this.hexagons.forEach((hex) => hex.destroy());
    this.hexagons = [];
  }
}
