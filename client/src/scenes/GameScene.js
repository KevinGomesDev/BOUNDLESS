import Phaser from "phaser";
import MapRenderer from "../modules/map/MapRenderer";
import socketService from "../services/SocketService";
import { CameraController } from "../modules/CameraController";
import { TerritoryModal } from "../modules/TerritoryModal";
import { CombatModal } from "../modules/CombatModal";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.mapRenderer = null;
    this.terrainConfig = null;
    this.cameraController = null;

    this.selectedTerritory = null;
    this.hoveredTerritory = null;

    this.dragStartX = 0;
    this.dragStartY = 0;
    this.isModalOpen = false;
  }

  create() {
    const totalWidth = 2000;
    const totalHeight = 1600;

    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);

    this.scene.launch("UIScene");
    this.territoryModal = new TerritoryModal(this);
    this.combatModal = new CombatModal(this);

    this.loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Sintonizando...", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // --- INPUTS ---
    this.input.on("pointerdown", (pointer) => {
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
    });

    this.input.on("pointerup", (pointer) => {
      if (this.isModalOpen) return;
      const dist = Phaser.Math.Distance.Between(
        this.dragStartX,
        this.dragStartY,
        pointer.x,
        pointer.y
      );
      if (dist < 5) {
        this.handleMapClick(pointer);
      }
    });

    this.input.keyboard.on("keydown-C", () => {
      if (!this.isModalOpen && this.selectedTerritory) {
        this.openCombatModal();
      }
    });

    this.cleanupSocket();
    this.setupSocket(totalWidth, totalHeight);
    socketService.emit("game:get_terrains");
  }

  cleanupSocket() {
    socketService.off("game:terrains_data");
    socketService.off("match:map_data");
    socketService.off("error");
  }

  setupSocket(w, h) {
    socketService.on("game:terrains_data", (config) => {
      this.terrainConfig = config;
      // Persist config for cross-scene usage
      this.game.registry.set("terrainConfig", config);
      socketService.emit("match:request_map");
    });

    socketService.on("match:map_data", (territories) => {
      if (this.loadingText) this.loadingText.destroy();

      if (!this.mapRenderer) {
        this.mapRenderer = new MapRenderer(this, this.terrainConfig || {});
      }
      this.mapRenderer.render(territories);

      if (!this.cameraController) {
        this.cameraController = new CameraController(this, w, h);
      }
    });
  }

  update(time, delta) {
    if (!this.mapRenderer) return;
    if (this.cameraController) this.cameraController.update(time, delta);

    if (!this.isModalOpen) {
      this.handleHoverLoop();
    }
  }

  // --- LÓGICA 1: HOVER (VISUAL) ---
  handleHoverLoop() {
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Obtém o território
    let target = this.mapRenderer.getTerritoryAt(worldPoint.x, worldPoint.y);

    // FILTRO DE ÁGUA: Se for água, tratamos como null para o Highlight
    // (Mas podemos manter o objeto para a UI mostrar "Águas Internacionais")
    const isInteractable = target && target.type === "LAND";

    if (this.hoveredTerritory !== target) {
      this.hoveredTerritory = target;

      // 1. Desenha Borda Branca (SÓ SE FOR TERRA)
      if (isInteractable) {
        this.mapRenderer.highlightHover(target);
      } else {
        this.mapRenderer.highlightHover(null);
      }

      // 2. Atualiza a TopBar (UI)
      const uiScene = this.scene.get("UIScene");
      if (uiScene) {
        // Atualiza sempre o bloco de HOVER com o alvo atual (ou null)
        uiScene.updateHoveredTerritoryInfo(target);
      }
    }
  }

  // --- LÓGICA 2: CLIQUE (AÇÃO) ---
  handleMapClick(pointer) {
    if (!this.mapRenderer) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const clickedTerritory = this.mapRenderer.getTerritoryAt(
      worldPoint.x,
      worldPoint.y
    );

    // FILTRO DE ÁGUA: Só processa seleção se for LAND
    if (clickedTerritory && clickedTerritory.type === "LAND") {
      this.processTerritorySelection(clickedTerritory);
    } else {
      // Clicou na Água ou Fora -> Deseleciona tudo
      this.deselectAll();
    }
  }

  deselectAll() {
    console.log("Limpando seleção.");
    this.selectedTerritory = null;
    // Clear saved selection
    this.game.registry.set("selectedTerritory", null);
    this.mapRenderer.highlightSelection(null);

    const uiScene = this.scene.get("UIScene");
    if (uiScene) uiScene.updateSelectedTerritoryInfo(null);
  }

  processTerritorySelection(territory) {
    // Verifica clique duplo
    const isSame =
      this.selectedTerritory &&
      this.selectedTerritory.mapIndex === territory.mapIndex;

    if (isSame) {
      // ABRE MODAL
      console.log("Abrindo modal para:", territory.terrainName);
      this.openTerritoryModal(territory);
    } else {
      // TROCA SELEÇÃO
      console.log("Selecionado:", territory.terrainName);
      this.selectedTerritory = territory;
      // Save selection for other scenes (e.g., TerritoryScene)
      this.game.registry.set("selectedTerritory", territory);

      this.mapRenderer.highlightSelection(territory);

      const uiScene = this.scene.get("UIScene");
      if (uiScene) uiScene.updateSelectedTerritoryInfo(territory);
    }
  }

  // --- MODAIS ---
  openTerritoryModal(data) {
    this.isModalOpen = true;
    this.territoryModal.show(data, this.terrainConfig);
    this.toggleUIModalState(true);
  }

  openCombatModal() {
    if (this.selectedTerritory) {
      this.isModalOpen = true;
      this.combatModal.show(this.selectedTerritory);
    }
  }

  toggleUIModalState(isOpen) {
    const uiScene = this.scene.get("UIScene");
    if (uiScene && uiScene.setModalState) uiScene.setModalState(isOpen);
  }

  closeModal() {
    this.isModalOpen = false;
    if (this.territoryModal) this.territoryModal.hide();
    if (this.combatModal) this.combatModal.hide();
    this.toggleUIModalState(false);
  }
}
