import Phaser from "phaser";

export class CameraController {
  constructor(scene, mapWidth, mapHeight) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.setupCamera();
    this.setupInput();
  }

  setupCamera() {
    const cam = this.scene.cameras.main;
    cam.setViewport(0, 0, this.mapWidth, this.scene.scale.height);
    // Adiciona margem de 200px para não travar seco ao arrastar
    cam.setBounds(
      -100,
      -100,
      this.mapWidth + 200,
      this.scene.scale.height + 200
    );
  }

  setupInput() {
    // ZOOM
    this.scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.x > this.mapWidth) return; // Ignora se estiver no HUD

      const cam = this.scene.cameras.main;
      let newZoom = cam.zoom;

      // --- CONFIGURAÇÕES DE VELOCIDADE ---
      const zoomSpeed = 0.25; // Aumentei de 0.1 para 0.25 (Mais rápido)
      const zoomDuration = 100; // Diminuí de 200 para 100ms (Mais responsivo)

      // Lógica de direção do zoom
      if (deltaY > 0) newZoom -= zoomSpeed; // Roda pra baixo (Zoom Out)
      if (deltaY < 0) newZoom += zoomSpeed; // Roda pra cima (Zoom In)

      // --- LIMITES ---
      // Min: 1.0 (Padrão inicial, não afasta mais que a tela original)
      // Max: 8.0 (Permite chegar bem perto para ver detalhes)
      newZoom = Phaser.Math.Clamp(newZoom, 1.0, 8.0);

      cam.zoomTo(newZoom, zoomDuration, "Sine.easeInOut", true);
    });

    // PAN (Início)
    this.scene.input.on("pointerdown", (pointer) => {
      if (pointer.x > this.mapWidth) return;
      this.isDragging = true;
      this.dragStart.x = pointer.x;
      this.dragStart.y = pointer.y;
    });

    // PAN (Fim)
    this.scene.input.on("pointerup", () => {
      this.isDragging = false;
    });

    // PAN (Movimento)
    this.scene.input.on("pointermove", (pointer) => {
      if (this.isDragging) {
        const cam = this.scene.cameras.main;
        const deltaX = (this.dragStart.x - pointer.x) / cam.zoom;
        const deltaY = (this.dragStart.y - pointer.y) / cam.zoom;

        cam.scrollX += deltaX;
        cam.scrollY += deltaY;

        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
      }
    });
  }
}
