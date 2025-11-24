import Phaser from "phaser";

export class CameraController {
  constructor(scene, mapWidth, mapHeight) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    // Estado do Zoom
    this.minZoom = 1.0;
    this.maxZoom = 4.0; // Quão perto pode chegar

    // Inicializa
    this.setupCamera();
    this.setupInput();

    // Adiciona listener para redimensionamento da janela (Responsividade)
    this.scene.scale.on("resize", this.handleResize, this);
  }

  setupCamera() {
    const cam = this.scene.cameras.main;
    const { width, height } = this.scene.scale;

    // 1. Configura o Viewport (Tamanho da janela de visão)
    cam.setViewport(0, 0, width, height);

    // 2. Configura os Limites do Mundo (Tamanho Real do Mapa)
    // Isso impede a câmera de andar para fora dessa área
    cam.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // 3. Calcula o Zoom Mínimo para cobrir a tela sem bordas pretas
    this.updateZoomLimits();

    // 4. Define o zoom inicial e centraliza
    cam.setZoom(this.minZoom);
    cam.centerOn(this.mapWidth / 2, this.mapHeight / 2);
  }

  updateZoomLimits() {
    const { width, height } = this.scene.scale;

    // Calcula a proporção necessária para cobrir largura e altura
    const zoomX = width / this.mapWidth;
    const zoomY = height / this.mapHeight;

    // Para garantir "Sem Bordas Pretas" (Cover), pegamos o MAIOR dos dois.
    // Assim, o mapa sempre preenche o eixo maior e sobra mapa para scroll no outro.
    this.minZoom = Math.max(zoomX, zoomY);

    // Se a tela for maior que o mapa (raro), o zoom min será > 1.
    // Garante que o zoom atual não viole o novo mínimo
    if (this.scene.cameras.main.zoom < this.minZoom) {
      this.scene.cameras.main.setZoom(this.minZoom);
    }
  }

  setupInput() {
    // --- ZOOM (Roda do Mouse) ---
    this.scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      const cam = this.scene.cameras.main;
      let newZoom = cam.zoom;

      // Velocidade do zoom
      const zoomSpeed = 0.05 * cam.zoom; // Proporcional ao zoom atual para suavidade

      if (deltaY > 0) newZoom -= zoomSpeed; // Zoom Out
      if (deltaY < 0) newZoom += zoomSpeed; // Zoom In

      // Trava nos limites calculados
      newZoom = Phaser.Math.Clamp(newZoom, this.minZoom, this.maxZoom);

      // Usa zoomTo para suavizar, ou setZoom direto para performance
      cam.setZoom(newZoom);

      // IMPORTANTE: Ao dar Zoom Out, a câmera pode sair do centro.
      // O Phaser tenta corrigir com setBounds, mas as vezes precisa de um empurrãozinho
      // para não mostrar borda preta num frame.
      this.clampCamera();
    });

    // --- PAN (Arrastar com Botão Direito) ---
    this.scene.input.on("pointerdown", (pointer) => {
      if (pointer.button === 2) {
        // Botão Direito
        this.isDragging = true;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.scene.game.canvas.style.cursor = "grabbing";
      }
    });

    this.scene.input.on("pointerup", () => {
      this.isDragging = false;
      this.scene.game.canvas.style.cursor = "default";
    });

    this.scene.input.on("pointermove", (pointer) => {
      if (this.isDragging) {
        const cam = this.scene.cameras.main;

        // Calcula quanto o mouse andou na tela
        const deltaX = (this.dragStart.x - pointer.x) / cam.zoom;
        const deltaY = (this.dragStart.y - pointer.y) / cam.zoom;

        // Aplica o movimento
        cam.scrollX += deltaX;
        cam.scrollY += deltaY;

        // Atualiza referência
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;

        // Garante que não saiu dos limites
        this.clampCamera();
      }
    });

    // Bloqueia menu de contexto
    this.scene.game.canvas.oncontextmenu = (e) => e.preventDefault();
  }

  // Força a câmera a ficar dentro dos limites (Manual Clamp)
  // O setBounds faz isso, mas essa função ajuda na matemática do Zoom Out
  clampCamera() {
    const cam = this.scene.cameras.main;
    // Apenas deixe o Phaser lidar com setBounds, geralmente é suficiente se o zoom estiver correto.
    // Se notar tremedeira nas bordas, podemos implementar lógica manual aqui.
  }

  handleResize(gameSize) {
    const cam = this.scene.cameras.main;
    cam.setViewport(0, 0, gameSize.width, gameSize.height);
    this.updateZoomLimits();
    this.clampCamera();
  }

  update(time, delta) {
    // Lógica de teclado (WASD) pode entrar aqui futuramente
  }
}
