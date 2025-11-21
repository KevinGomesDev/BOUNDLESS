export class InteractionHandler {
  constructor(scene, mapGenerator, mapWidth) {
    this.scene = scene;
    this.mapGenerator = mapGenerator;
    this.mapWidth = mapWidth;

    // Estados
    this.selectedIndex = -1;
    this.hoveredIndex = -1;

    // Gráficos
    this.selectionGraphics = scene.add.graphics(); // Persistente
    this.highlightGraphics = scene.add.graphics(); // Volátil (Hover)

    this.setupInput();
  }

  setupInput() {
    this.scene.input.on("pointermove", (pointer) => {
      // 1. Se o modal estiver aberto, ignora o mapa de fundo
      if (this.scene.isModalOpen) return;

      // 2. Se não estiver na visão de Mapa Mundi, ignora
      if (this.scene.currentView !== "STRATEGY") {
        this.clearHover();
        return;
      }

      if (pointer.isDown) return; // Não faz hover se estiver arrastando

      if (pointer.x < this.mapWidth) {
        this.handleHover(pointer);
      } else {
        this.clearHover();
      }
    });

    this.scene.input.on("pointermove", (pointer) => {
      // SE O MODAL ESTIVER ABERTO, NÃO FAÇA NADA.
      // Não limpe, não calcule hover, apenas ignore.
      if (this.scene.isModalOpen) return;

      if (this.scene.currentView && this.scene.currentView !== "STRATEGY") {
        this.clearHover();
        return;
      }

      // 2. Se não estiver na visão de Mapa Mundi, ignora cliques no mapa
      if (this.scene.currentView !== "STRATEGY") return;

      if (pointer.isDown) return;
      if (pointer.x < this.mapWidth) {
        this.handleHover(pointer);
      } else {
        this.clearHover();
      }
    });

    this.scene.input.on("pointerdown", (pointer) => {
      // CORREÇÃO AQUI:
      // Se o modal estiver aberto, este Handler NÃO deve fazer nada.
      // A responsabilidade de fechar agora é do próprio Modal.
      if (this.scene.isModalOpen) return;

      if (this.scene.currentView && this.scene.currentView !== "STRATEGY")
        return;

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
      // Só desenha hover se não estiver selecionado
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
    const uiScene = this.scene.scene.get("UIScene");

    if (data && data.type === "LAND") {
      if (this.selectedIndex === index) {
        // --- LÓGICA DE MODAL (2º CLIQUE) ---
        // Se já estava selecionado e clicou de novo -> Abre Modal de Território
        this.scene.openTerritoryModal(index);
      } else {
        // Selecionar Novo Território
        this.selectedIndex = index;
        this.selectionGraphics.clear();
        this.drawBorder(this.selectionGraphics, index, 0xffffff, 5);
        this.highlightGraphics.clear();
        uiScene.updateInfo(data);
      }
    } else {
      // Clicou fora/mar -> Deselecionar tudo
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
