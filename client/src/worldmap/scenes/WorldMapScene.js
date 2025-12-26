import Phaser from "phaser";
import MapRenderer from "../rendering/MapRenderer";
import socketService from "../../services/SocketService";
import { CameraController } from "../camera/CameraController";

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super("WorldMapScene");

    this.mapRenderer = null;
    this.terrainConfig = null;
    this.cameraController = null;

    this.selectedTerritory = null;
    this.hoveredTerritory = null;

    this.lastActionWasDrag = false;
  }

  create() {
    const totalWidth = 2000;
    const totalHeight = 1600;

    // Cor do oceano para fundo uniforme
    this.cameras.main.setBackgroundColor("#457b9d");
    this.cameras.main.setBounds(0, 0, totalWidth, totalHeight);

    this.scene.launch("UIScene");

    this.loadingText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Sintonizando...", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // --- INPUTS ---
    this.input.on("pointerup", (pointer) => {
      this.handleMapClick(pointer);
    });

    // --- SOCKETS ---
    socketService.on(
      "worldmap:terrains_data",
      this.handleTerrainConfigs.bind(this)
    );
    socketService.on("worldmap:map_data", this.handleMapLoaded.bind(this));

    // Requisita dados
    socketService.emit("worldmap:get_terrains");

    // Pega o matchId do registry (se existir)
    const matchId = this.registry.get("currentMatchId");
    console.log("[WorldMapScene] Requisitando mapa com matchId:", matchId);
    socketService.emit("worldmap:request_map", { matchId });
  }

  handleTerrainConfigs(data) {
    console.log("[WorldMapScene] Terrains recebidos:", data);
    this.terrainConfig = data;
  }

  handleMapLoaded(data) {
    console.log("[WorldMapScene] Mapa carregado:", data);
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }

    // TESTE DIRETO: Desenha retângulo na cena
    const testRect = this.add.rectangle(400, 300, 200, 150, 0xff0000);
    testRect.setDepth(100);
    console.log("[WorldMapScene] TESTE: Retângulo criado diretamente na cena");

    this.mapRenderer = new MapRenderer(this, this.terrainConfig);
    // data já é o array de territórios direto do servidor
    this.mapRenderer.render(data);

    this.cameraController = new CameraController(this);
    this.cameraController.resetToFullView();

    // Adiciona listener de hover
    this.input.on("pointermove", (pointer) => {
      if (this.cameraController?.isDragging) return;

      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const territory = this.mapRenderer.getTerritoryAt(worldX, worldY);

      if (territory !== this.hoveredTerritory) {
        this.hoveredTerritory = territory;
        if (territory) {
          this.mapRenderer.highlightHover(territory);
          const uiScene = this.scene.get("UIScene");
          if (uiScene) {
            uiScene.updateTerritoryInfo(territory);
          }
        } else {
          this.mapRenderer.highlightHover(null);
          const uiScene = this.scene.get("UIScene");
          if (uiScene) {
            uiScene.updateTerritoryInfo(null);
          }
        }
      }
    });
  }

  handleMapClick(pointer) {
    if (this.cameraController?.lastActionWasDrag) {
      this.cameraController.lastActionWasDrag = false;
      return;
    }

    const worldX = pointer.worldX;
    const worldY = pointer.worldY;
    const territory = this.mapRenderer?.getTerritoryAt(worldX, worldY);

    if (territory && territory.type === "LAND") {
      // Seleciona o território
      this.selectedTerritory = territory;
      this.mapRenderer.highlightSelection(territory);

      const uiScene = this.scene.get("UIScene");
      if (uiScene) {
        uiScene.updateTerritoryInfo(territory);
        // Habilita aba de Território
        uiScene.setTabEnabled("territory", true);
      }

      // Duplo clique abre a cena de Território
      if (
        pointer.getDuration() < 300 &&
        this.lastClickTime &&
        Date.now() - this.lastClickTime < 300
      ) {
        this.openTerritoryScene(territory);
      }
      this.lastClickTime = Date.now();
    } else {
      // Deseleciona
      this.selectedTerritory = null;
      this.mapRenderer?.highlightSelection(null);
      const uiScene = this.scene.get("UIScene");
      if (uiScene) {
        uiScene.setTabEnabled("territory", false);
      }
    }
  }

  openTerritoryScene(territory) {
    // Passa dados do território para a TerritoryScene
    this.scene.start("TerritoryScene", {
      territory: territory,
      terrainConfig: this.terrainConfig,
    });
  }

  shutdown() {
    socketService.off("worldmap:terrains_data");
    socketService.off("worldmap:map_data");
  }
}
