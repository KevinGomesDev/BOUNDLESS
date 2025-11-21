import { InteractiveHexagon } from "./components/InteractiveHexagon";
import { GridCalculator } from "../utils/GridCalculator";

export class TerritoryModal {
  constructor(scene) {
    this.scene = scene;
    this.hexagons = [];
    this.selectedHexId = -1;

    // 1. UI Setup
    this.createBackdrop();

    // Container Centralizado
    this.container = this.scene.add.container(
      this.scene.scale.width / 2,
      this.scene.scale.height / 2
    );
    this.container.setScrollFactor(0).setDepth(21).setVisible(false);

    this.borderGraphics = this.scene.add.graphics();
    this.container.add(this.borderGraphics);
  }

  createBackdrop() {
    this.backdrop = this.scene.add.rectangle(
      0,
      0,
      this.scene.scale.width,
      this.scene.scale.height,
      0x000000,
      0.85
    );
    this.backdrop
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(20)
      .setVisible(false);

    this.backdrop.setInteractive();
    this.backdrop.on("pointerdown", () => this.scene.closeTerritoryModal());
  }

  show(index, mapGenerator) {
    const rawPoly = mapGenerator.getPolygon(index);
    const data = mapGenerator.territoryData[index]; // Aqui temos data.size

    if (!rawPoly) return;

    this.backdrop.setVisible(true);
    this.container.setVisible(true);

    // 1. Preparar Geometria
    const geometry = GridCalculator.normalizePolygon(
      rawPoly,
      this.scene.scale.width,
      this.scene.scale.height
    );

    // 2. Desenhar Borda
    this.drawBorder(geometry.points);

    // 3. Definir Quantidade de Hexágonos baseado no Size
    // Passamos o objeto 'data' inteiro ou apenas a propriedade size
    const targetCount = this.determineTerritorySize(data);

    // 4. Gerar Grid
    const gridData = GridCalculator.generateHexPositions(
      geometry.phaserPoly,
      targetCount
    );

    // 5. Criar Componentes Visuais
    // Usa a cor do terreno ou um fallback
    const hexColor = data.terrain ? data.terrain.color : 0x888888;
    this.createHexagons(gridData, hexColor);
  }

  hide() {
    this.backdrop.setVisible(false);
    this.container.setVisible(false);

    // Limpa componentes
    this.hexagons.forEach((hex) => hex.destroy());
    this.hexagons = [];
    this.borderGraphics.clear();
    this.selectedHexId = -1;
  }

  drawBorder(points) {
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(4, 0xffffff, 0.5);
    this.borderGraphics.beginPath();
    this.borderGraphics.moveTo(points[0].x, points[0].y);
    points.forEach((p) => this.borderGraphics.lineTo(p.x, p.y));
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

    console.log(`Hex ${newId} selecionado.`);
  }

  /**
   * Converte a string de tamanho (Pequeno, Médio, Grande) em quantidade de slots
   */
  determineTerritorySize(data) {
    // Mapa de configuração
    const sizeMap = {
      Pequeno: 10,
      Médio: 20,
      Grande: 30,
    };

    // Retorna o valor mapeado ou 20 como padrão de segurança
    return sizeMap[data.size] || 20;
  }
}
