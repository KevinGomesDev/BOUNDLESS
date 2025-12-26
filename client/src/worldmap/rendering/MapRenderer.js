import Phaser from "phaser";

export default class MapRenderer {
  constructor(scene, terrainConfig) {
    this.scene = scene;

    // 1. Configuração de Terrenos
    this.terrainConfig = terrainConfig || {};

    // 2. Camadas Visuais (Z-Index implícito pela ordem de criação)
    this.waterLayer = this.scene.add.graphics();
    this.landLayer = this.scene.add.graphics();
    this.borderLayer = this.scene.add.graphics();

    // Camadas de Interação
    this.selectionLayer = this.scene.add.graphics(); // Seleção Fixa (Dourada)
    this.overlayLayer = this.scene.add.graphics(); // Hover (Branco)

    this.territoryMap = new Map();
  }

  render(territoriesData) {
    console.log("--- INICIANDO RENDERIZAÇÃO ---");
    this.clear();

    territoriesData.forEach((territory, index) => {
      // Parse dos pontos
      const points = JSON.parse(territory.polygonData);
      const phaserPoints = points.map((p) => ({ x: p[0], y: p[1] }));

      // Determina Cor e Nome
      const terrainKey = territory.terrainType;
      let terrainInfo = null;
      let color = 0xff0000; // Fallback de erro (Vermelho)

      if (this.terrainConfig && this.terrainConfig[terrainKey]) {
        terrainInfo = this.terrainConfig[terrainKey];
        color = terrainInfo.color;
      } else {
        // Fallback seguro
        if (this.terrainConfig && this.terrainConfig.PLAINS) {
          color = this.terrainConfig.PLAINS.color;
        }
        if (index === 0)
          console.warn(`Aviso: Config ausente para ${terrainKey}`);
      }

      // Desenha
      if (territory.type === "WATER") {
        const oceanColor = this.terrainConfig.OCEAN
          ? this.terrainConfig.OCEAN.color
          : 0x0000ff;
        this.drawPoly(this.waterLayer, phaserPoints, oceanColor, 0.8);
      } else {
        this.drawPoly(this.landLayer, phaserPoints, color, 1);
        this.drawBorder(this.borderLayer, phaserPoints);
      }

      // Registra área de clique
      const hitPoly = new Phaser.Geom.Polygon(phaserPoints);
      this.territoryMap.set(territory.mapIndex, {
        ...territory,
        geom: hitPoly,
        terrainName: terrainInfo
          ? terrainInfo.name
          : `Desconhecido (${terrainKey})`,
        center: { x: territory.centerX, y: territory.centerY },
      });
    });

    console.log("--- FIM RENDERIZAÇÃO ---");
  }

  drawPoly(graphics, points, color, alpha) {
    graphics.fillStyle(color, alpha);
    graphics.fillPoints(points, true);
  }

  drawBorder(graphics, points) {
    graphics.lineStyle(2, 0x000000, 0.3);
    graphics.strokePoints(points, true);
  }

  clear() {
    this.waterLayer.clear();
    this.landLayer.clear();
    this.borderLayer.clear();
    this.overlayLayer.clear();
    this.selectionLayer.clear();
    this.territoryMap.clear();
  }

  getTerritoryAt(worldX, worldY) {
    for (let [index, data] of this.territoryMap) {
      if (Phaser.Geom.Polygon.Contains(data.geom, worldX, worldY)) {
        return data;
      }
    }
    return null;
  }

  // --- HIGHLIGHTS ---

  // Usado para HOVER (Passageiro)
  highlightHover(territoryData) {
    this.overlayLayer.clear();
    if (!territoryData) return;

    const points = this.getPointsFromData(territoryData);

    this.overlayLayer.lineStyle(2, 0xffffff, 0.8); // Borda Branca
    this.overlayLayer.strokePoints(points, true);
    this.overlayLayer.fillStyle(0xffffff, 0.1); // Brilho leve
    this.overlayLayer.fillPoints(points, true);
  }

  // Usado para SELEÇÃO (Fixo)
  highlightSelection(territoryData) {
    this.selectionLayer.clear();
    if (!territoryData) return;

    const points = this.getPointsFromData(territoryData);

    this.selectionLayer.lineStyle(4, 0xffd700, 1); // Borda Dourada Grossa
    this.selectionLayer.strokePoints(points, true);
    this.selectionLayer.fillStyle(0xffd700, 0.15); // Brilho Dourado
    this.selectionLayer.fillPoints(points, true);
  }

  // Helper para evitar repetição do JSON.parse
  getPointsFromData(data) {
    if (typeof data.polygonData === "string") {
      return JSON.parse(data.polygonData).map((p) => ({ x: p[0], y: p[1] }));
    }
    return data.polygonData; // Caso já tenha sido parseado antes (dependendo da implementação)
  }
}
