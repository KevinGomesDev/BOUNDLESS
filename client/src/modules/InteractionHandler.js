export class InteractionHandler {
  constructor(scene, mapGenerator, mapWidth) {
    this.scene = scene;
    this.mapGenerator = mapGenerator;
    this.mapWidth = mapWidth;

    // Estados
    this.selectedIndex = -1;
    this.hoveredIndex = -1;

    // Gráficos
    this.selectionGraphics = scene.add.graphics();
    this.highlightGraphics = scene.add.graphics();

    this.setupInput();
  }

  setupInput() {
    this.scene.input.on("pointermove", (pointer) => {
      // Se estiver arrastando a câmera (verificamos se o botão está apertado), não faz hover
      if (pointer.isDown) return;

      if (pointer.x < this.mapWidth) {
        this.handleHover(pointer);
      } else {
        this.clearHover();
      }
    });

    this.scene.input.on("pointerdown", (pointer) => {
      if (pointer.x < this.mapWidth) {
        this.handleClick(pointer);
      }
    });
  }

  handleHover(pointer) {
    const index = this.mapGenerator.getTerritoryIdAt(
      pointer.worldX,
      pointer.worldY
    );

    if (this.hoveredIndex === index) return;
    this.hoveredIndex = index;

    this.highlightGraphics.clear();
    const data = this.mapGenerator.territoryData[index];

    if (data && data.type === "LAND") {
      this.scene.input.manager.canvas.style.cursor = "pointer";
      if (index !== this.selectedIndex) {
        this.drawBorder(this.highlightGraphics, index, 0xffffff, 4);
      }
    } else {
      this.scene.input.manager.canvas.style.cursor = "default";
    }
  }

  clearHover() {
    this.hoveredIndex = -1;
    this.highlightGraphics.clear();
    this.scene.input.manager.canvas.style.cursor = "default";
  }

  handleClick(pointer) {
    const index = this.mapGenerator.getTerritoryIdAt(
      pointer.worldX,
      pointer.worldY
    );
    const data = this.mapGenerator.territoryData[index];
    const uiScene = this.scene.scene.get("UIScene"); // Pega referência da outra cena

    if (data && data.type === "LAND") {
      if (this.selectedIndex === index) {
        // Deselecionar
        this.selectedIndex = -1;
        this.selectionGraphics.clear();
        uiScene.updateInfo(null);
      } else {
        // Selecionar
        this.selectedIndex = index;
        this.selectionGraphics.clear();
        this.drawBorder(this.selectionGraphics, index, 0xffffff, 5);
        this.highlightGraphics.clear(); // Limpa hover para não sobrepor
        uiScene.updateInfo(data);
      }
    } else {
      // Clicou fora/mar
      this.selectedIndex = -1;
      this.selectionGraphics.clear();
      uiScene.updateInfo(null);
    }
  }

  drawBorder(graphics, index, color, width) {
    const poly = this.mapGenerator.getPolygon(index);
    if (poly) {
      graphics.lineStyle(width, color, 1);
      graphics.beginPath();
      graphics.moveTo(poly[0][0], poly[0][1]);
      for (let j = 1; j < poly.length; j++) {
        graphics.lineTo(poly[j][0], poly[j][1]);
      }
      graphics.closePath();
      graphics.strokePath();
    }
  }
}
