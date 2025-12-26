import Phaser from "phaser";

export class CameraController {
  constructor(scene, mapWidth, mapHeight) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragDistance = 0; // Para diferenciar clique de drag
    this.dragThreshold = 5; // Pixels mínimos para considerar drag

    // Estado do Zoom
    this.absoluteMinZoom = 0.3; // Zoom out máximo permitido (30% do tamanho)
    this.coverZoom = 1.0; // Zoom calculado para cobrir tela sem bordas pretas
    this.fitZoom = 1.0; // Zoom calculado para mostrar mapa completo
    this.maxZoom = 4.0;

    // Controles de teclado
    this.keyboardSpeed = 300; // Pixels por segundo
    this.keys = null;

    // Inicializa
    this.setupCamera();
    this.setupInput();
    this.setupKeyboard();

    // Adiciona listener para redimensionamento da janela (Responsividade)
    this.scene.scale.on("resize", this.handleResize, this);
  }

  setupCamera() {
    const cam = this.scene.cameras.main;
    const { width, height } = this.scene.scale;

    // 1. Configura o Viewport (Tamanho da janela de visão)
    cam.setViewport(0, 0, width, height);

    // 2. Remove limites do mundo para permitir ver espaço ao redor do mapa
    cam.removeBounds();

    // 3. Calcula os diferentes zooms
    this.calculateZoomLevels();

    // 4. Define o zoom inicial para mostrar o mapa completo
    cam.setZoom(this.fitZoom);
    cam.centerOn(this.mapWidth / 2, this.mapHeight / 2);
  }

  calculateZoomLevels() {
    const { width, height } = this.scene.scale;

    // Zoom para cobrir tela (sem bordas pretas)
    const zoomX = width / this.mapWidth;
    const zoomY = height / this.mapHeight;
    this.coverZoom = Math.max(zoomX, zoomY);

    // Zoom para mostrar mapa completo (fit)
    // Adiciona uma margem de 10% ao redor do mapa
    const marginFactor = 0.9; // 90% da tela = 10% de margem
    const fitZoomX = (width * marginFactor) / this.mapWidth;
    const fitZoomY = (height * marginFactor) / this.mapHeight;
    this.fitZoom = Math.min(fitZoomX, fitZoomY);

    // Garante que fitZoom não seja menor que o mínimo absoluto
    this.fitZoom = Math.max(this.fitZoom, this.absoluteMinZoom);
  }

  updateZoomLimits() {
    this.calculateZoomLevels();

    // Garante que o zoom atual não viole os limites
    const cam = this.scene.cameras.main;
    if (cam.zoom < this.absoluteMinZoom) {
      cam.setZoom(this.absoluteMinZoom);
    }
  }

  setupInput() {
    // --- ZOOM (Roda do Mouse) ---
    this.scene.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      const cam = this.scene.cameras.main;
      let newZoom = cam.zoom;

      // Velocidade do zoom proporcional para suavidade
      const zoomSpeed = 0.05 * cam.zoom;

      if (deltaY > 0) newZoom -= zoomSpeed; // Zoom Out
      if (deltaY < 0) newZoom += zoomSpeed; // Zoom In

      // Trava nos limites (absoluteMinZoom até maxZoom)
      newZoom = Phaser.Math.Clamp(newZoom, this.absoluteMinZoom, this.maxZoom);
      cam.setZoom(newZoom);

      this.clampCamera();
    });

    // --- PAN (Arrastar com Botão ESQUERDO ou DIREITO) ---
    this.scene.input.on("pointerdown", (pointer) => {
      // Ignora se modal estiver aberto
      if (this.scene.isModalOpen) return;

      // Aceita botão esquerdo (0) ou direito (2)
      if (pointer.button === 0 || pointer.button === 2) {
        this.isDragging = true;
        this.dragDistance = 0;
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;
        this.scene.game.canvas.style.cursor = "grabbing";
      }
    });

    this.scene.input.on("pointerup", (pointer) => {
      if (this.isDragging) {
        this.isDragging = false;
        this.scene.game.canvas.style.cursor = "default";

        // Notifica a cena se foi um drag significativo
        // (para que não dispare clique em territórios)
        if (this.dragDistance > this.dragThreshold) {
          this.scene.lastActionWasDrag = true;
          // Reseta após um frame para não bloquear próximos cliques
          this.scene.time.delayedCall(10, () => {
            this.scene.lastActionWasDrag = false;
          });
        }
      }
    });

    this.scene.input.on("pointermove", (pointer) => {
      if (this.isDragging) {
        const cam = this.scene.cameras.main;

        // Calcula distância total arrastada
        const dx = this.dragStart.x - pointer.x;
        const dy = this.dragStart.y - pointer.y;
        this.dragDistance += Math.sqrt(dx * dx + dy * dy);

        // Calcula movimento compensado por zoom
        const deltaX = dx / cam.zoom;
        const deltaY = dy / cam.zoom;

        // Aplica o movimento
        cam.scrollX += deltaX;
        cam.scrollY += deltaY;

        // Atualiza referência
        this.dragStart.x = pointer.x;
        this.dragStart.y = pointer.y;

        this.clampCamera();
      }
    });

    // Bloqueia menu de contexto
    this.scene.game.canvas.oncontextmenu = (e) => e.preventDefault();
  }

  setupKeyboard() {
    // Configurar teclas WASD + Setas + Atalhos
    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    // Atalho HOME: Volta à vista completa do mapa
    this.scene.input.keyboard.on("keydown-HOME", () => {
      if (!this.scene.isModalOpen) {
        this.resetToFullView();
      }
    });
  }

  // Reseta para a vista inicial (mapa completo)
  resetToFullView() {
    const cam = this.scene.cameras.main;

    // Anima o zoom e posição suavemente
    this.scene.tweens.add({
      targets: cam,
      zoom: this.fitZoom,
      scrollX: (this.mapWidth - cam.width / this.fitZoom) / 2,
      scrollY: (this.mapHeight - cam.height / this.fitZoom) / 2,
      duration: 500,
      ease: "Power2",
    });
  }

  // Retorna true se houve drag significativo (para GameScene ignorar clique)
  isDragAction() {
    return this.dragDistance > this.dragThreshold;
  }

  // Força a câmera a ficar centrada no mapa quando zoom out extremo
  clampCamera() {
    const cam = this.scene.cameras.main;

    // Em zoom muito baixo, permite que a câmera mostre espaço ao redor
    // mas mantém o mapa centralizado
    const visibleWidth = this.scene.scale.width / cam.zoom;
    const visibleHeight = this.scene.scale.height / cam.zoom;

    // Calcula limites para manter o mapa visível
    const minX = Math.min(0, (visibleWidth - this.mapWidth) / 2);
    const maxX = Math.max(this.mapWidth, (visibleWidth + this.mapWidth) / 2);
    const minY = Math.min(0, (visibleHeight - this.mapHeight) / 2);
    const maxY = Math.max(this.mapHeight, (visibleHeight + this.mapHeight) / 2);

    // Aplica limites dinâmicos baseados no zoom
    if (cam.zoom <= this.fitZoom) {
      // Em zoom out extremo, força centralização
      cam.centerOn(this.mapWidth / 2, this.mapHeight / 2);
    } else {
      // Em zoom normal, permite pan livre mas com limites
      const centerX = cam.scrollX + cam.width / (2 * cam.zoom);
      const centerY = cam.scrollY + cam.height / (2 * cam.zoom);

      if (centerX < minX) cam.scrollX = minX - cam.width / (2 * cam.zoom);
      if (centerX > maxX) cam.scrollX = maxX - cam.width / (2 * cam.zoom);
      if (centerY < minY) cam.scrollY = minY - cam.height / (2 * cam.zoom);
      if (centerY > maxY) cam.scrollY = maxY - cam.height / (2 * cam.zoom);
    }
  }

  handleResize(gameSize) {
    const cam = this.scene.cameras.main;
    cam.setViewport(0, 0, gameSize.width, gameSize.height);
    this.updateZoomLimits();
    this.clampCamera();
  }

  update(time, delta) {
    // Ignora inputs de teclado se modal estiver aberto
    if (this.scene.isModalOpen) return;

    const cam = this.scene.cameras.main;
    const speed = (this.keyboardSpeed * delta) / 1000; // Converte para pixels por frame

    // WASD ou Setas para mover a câmera
    if (this.keys.up.isDown || this.keys.arrowUp.isDown) {
      cam.scrollY -= speed / cam.zoom;
    }
    if (this.keys.down.isDown || this.keys.arrowDown.isDown) {
      cam.scrollY += speed / cam.zoom;
    }
    if (this.keys.left.isDown || this.keys.arrowLeft.isDown) {
      cam.scrollX -= speed / cam.zoom;
    }
    if (this.keys.right.isDown || this.keys.arrowRight.isDown) {
      cam.scrollX += speed / cam.zoom;
    }

    // Garante que não saiu dos limites
    if (
      this.keys.up.isDown ||
      this.keys.down.isDown ||
      this.keys.left.isDown ||
      this.keys.right.isDown ||
      this.keys.arrowUp.isDown ||
      this.keys.arrowDown.isDown ||
      this.keys.arrowLeft.isDown ||
      this.keys.arrowRight.isDown
    ) {
      this.clampCamera();
    }
  }
}
