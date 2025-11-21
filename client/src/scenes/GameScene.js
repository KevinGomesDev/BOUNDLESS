import Phaser from "phaser";
import { MapGenerator } from "../utils/MapGenerator";
import { CameraController } from "../modules/CameraController";
import { InteractionHandler } from "../modules/InteractionHandler";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.currentView = "STRATEGY";
  }

  create() {
    const totalWidth = this.scale.width;
    const totalHeight = this.scale.height;

    // --- LAYOUT NOVO (Sem Sidebar, Com Header) ---
    const HUD_HEIGHT = 100; // Altura reservada para o Topo

    // O mapa agora usa a largura TOTAL
    const mapWidth = totalWidth;

    // A altura do mapa é o que sobra abaixo do HUD
    const mapHeight = totalHeight - HUD_HEIGHT;

    // 1. Gerar Dados do Mundo
    // Passamos as dimensões corretas (sem o topo) para o gerador
    const mapGenerator = new MapGenerator(mapWidth, mapHeight);
    mapGenerator.generate();

    // 2. Inicializa UI (HUD no Topo)
    this.scene.launch("UIScene");

    // 3. Renderização do Mapa Estático
    this.drawStaticMap(mapGenerator);

    // 4. Controlador de Câmera
    const camCtrl = new CameraController(this, mapWidth, mapHeight);

    // AJUSTE CRÍTICO DE LAYOUT:
    // A câmera começa em Y=100 (pula o HUD) e tem a altura restante.
    // Isso impede que o mapa seja desenhado atrás da interface superior.
    this.cameras.main.setViewport(0, HUD_HEIGHT, mapWidth, mapHeight);

    // 5. Controlador de Interação
    const interaction = new InteractionHandler(this, mapGenerator, mapWidth);

    // Listener para mudança de View vinda do HUD
    const uiScene = this.scene.get("UIScene");
    if (uiScene) {
      this.events.on("CHANGE_VIEW", (view) => {
        this.handleViewChange(view);
      });
    }
  }

  handleViewChange(view) {
    this.currentView = view;
    // console.log("Mudando para visão:", view);
  }

  drawStaticMap(mapGenerator) {
    const graphics = this.add.graphics();

    mapGenerator.territoryData.forEach((data, i) => {
      const poly = mapGenerator.getPolygon(i);
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
