import Phaser from "phaser";
import { MapGenerator } from "../utils/MapGenerator";
import { CameraController } from "../modules/CameraController";
import { InteractionHandler } from "../modules/InteractionHandler";
import { TerritoryModal } from "../modules/TerritoryModal";
import { CombatModal } from "../modules/CombatModal";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });

    this.strategyGraphics = null;

    // Módulos
    this.territoryModal = null;
    this.interactionHandler = null;
    this.cameraController = null;

    this.isModalOpen = false;

    // --- CORREÇÃO 1: Estado da View ---
    // Essencial para o InteractionHandler saber que pode aceitar cliques
    this.currentView = "STRATEGY";

    this.mapGenerator = null;
    this.mapWidth = 0;
    this.mapHeight = 0;

    this.combatModal = null; // <--- Referência
  }

  create() {
    const totalWidth = this.scale.width;
    const totalHeight = this.scale.height;

    // --- CORREÇÃO DO PROBLEMA DE CLIQUE DESLOCADO ---
    // 1. Reseta qualquer viewport anterior (remove margens pretas/cortes)
    this.cameras.main.setViewport(0, 0, totalWidth, totalHeight);

    // 2. Reseta o scroll da câmera para o topo (garante que 0,0 é 0,0)
    this.cameras.main.setScroll(0, 0);

    // 3. Garante que a câmera olhe para o centro correto inicialmente
    // (Opcional, mas bom para evitar offsets estranhos na inicialização)
    this.cameras.main.centerOn(totalWidth / 2, totalHeight / 2);

    // --- FIM DA CORREÇÃO ---

    // --- CORREÇÃO: MAPA FULL SCREEN ---
    // Removemos a subtração da Sidebar ou HUD. O mapa ocupa tudo.
    this.mapWidth = totalWidth;
    this.mapHeight = totalHeight;

    // 1. Gerar Dados
    this.mapGenerator = new MapGenerator(this.mapWidth, this.mapHeight);
    this.mapGenerator.generate();

    // 2. UI e Inicialização de Módulos
    this.scene.launch("UIScene");
    this.territoryModal = new TerritoryModal(this);
    this.combatModal = new CombatModal(this); // <--- Instancia

    // 3. Inicializar Mapas Gráficos
    this.strategyGraphics = this.add.graphics();
    this.drawStaticMap();

    this.input.keyboard.on("keydown-C", () => {
      if (!this.isModalOpen) {
        // Só abre se não tiver outro aberto
        this.openCombatModal();
      }
    });

    // 4. Controladores
    this.cameraController = new CameraController(
      this,
      this.mapWidth,
      this.mapHeight
    );

    // Viewport ocupa a tela toda (0, 0)
    this.cameras.main.setViewport(0, 0, totalWidth, totalHeight);

    // InteractionHandler recebe a largura total para permitir cliques na tela toda
    this.interactionHandler = new InteractionHandler(
      this,
      this.mapGenerator,
      this.mapWidth
    );
  }

  openTerritoryModal(index) {
    this.isModalOpen = true;
    this.territoryModal.show(index, this.mapGenerator);
    this.toggleUIModalState(true);
  }

  openCombatModal() {
    // Pega o ID do território selecionado atualmente
    const selectedId = this.interactionHandler.selectedIndex;

    if (selectedId !== -1) {
      const data = this.mapGenerator.territoryData[selectedId];

      this.isModalOpen = true;
      // Passa os dados para o modal saber a cor
      this.combatModal.show(data);
    } else {
      console.log("Selecione um território primeiro para entrar em combate!");
    }
  }

  // Precisamos atualizar a função de fechar ou criar uma callback
  // No CombatModal eu chamei `this.scene.onCombatClose()`
  onCombatClose() {
    this.isModalOpen = false;
  }

  closeTerritoryModal() {
    this.isModalOpen = false;
    this.territoryModal.hide();
    this.toggleUIModalState(false);
  }

  toggleUIModalState(isOpen) {
    const uiScene = this.scene.get("UIScene");
    if (uiScene && uiScene.setModalState) {
      uiScene.setModalState(isOpen);
    }
  }

  drawStaticMap() {
    const graphics = this.strategyGraphics;
    const gen = this.mapGenerator;

    gen.territoryData.forEach((data, i) => {
      const poly = gen.getPolygon(i);
      if (!poly) return;

      graphics.beginPath();
      graphics.moveTo(poly[0][0], poly[0][1]);
      for (let j = 1; j < poly.length; j++) {
        graphics.lineTo(poly[j][0], poly[j][1]);
      }
      graphics.closePath();

      if (data.type === "WATER") {
        graphics.fillStyle(data.terrain.color, 1);
        graphics.fillPath();
      } else {
        graphics.fillStyle(data.terrain.color, 1);
        graphics.lineStyle(2, 0x1a1a1a, 1);
        graphics.fillPath();
        graphics.strokePath();
      }
    });
  }
}
