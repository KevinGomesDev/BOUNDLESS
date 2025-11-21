import Phaser from "phaser";

export class InteractiveHexagon {
  constructor(scene, container, config) {
    this.scene = scene;
    this.id = config.id;
    this.baseColor = config.color || 0x888888; // Cor fallback se vier undefined
    this.radius = config.radius;

    // Callback de clique (passado pelo pai)
    this.onSelect = config.onSelect;

    // Cria o gráfico
    this.graphics = scene.add.graphics();

    // --- CORREÇÃO CRÍTICA DE POSICIONAMENTO ---
    // Movemos o OBJETO para a posição final, e desenhamos em (0,0)
    this.graphics.setPosition(config.x, config.y);
    container.add(this.graphics);

    this.isSelected = false;

    this.setupInteractive();
    this.draw();
  }

  setupInteractive() {
    // Como o gráfico já está em X,Y, o HitArea deve ser local (0,0)
    const hitCircle = new Phaser.Geom.Circle(0, 0, this.radius * 0.95);

    this.graphics.setInteractive(hitCircle, Phaser.Geom.Circle.Contains);

    this.graphics.on("pointerover", () => {
      this.scene.input.manager.canvas.style.cursor = "pointer";
      this.draw(0xffffff); // Highlight Branco
    });

    this.graphics.on("pointerout", () => {
      this.scene.input.manager.canvas.style.cursor = "default";
      this.draw(); // Volta ao normal
    });

    this.graphics.on("pointerdown", (pointer, localX, localY, event) => {
      // --- CORREÇÃO CRÍTICA DE EVENTO ---
      event.stopPropagation(); // <--- IMPEDE O CLIQUE DE PASSAR PARA O BACKDROP

      if (this.onSelect) {
        this.onSelect(this.id);
      }
    });
  }

  setSelected(state) {
    this.isSelected = state;
    this.draw();
  }

  draw(overrideColor = null) {
    const g = this.graphics;
    g.clear();

    let color = this.baseColor;
    let alpha = 1; // Semitransparente para ver o fundo preto se quiser
    let lineThick = 2;

    if (overrideColor !== null) {
      color = overrideColor;
    } else if (this.isSelected) {
      color = 0xffd700; // Dourado
      lineThick = 4;
    }

    g.fillStyle(color, alpha);
    g.lineStyle(lineThick, 0x000000, 1);

    // Desenha centrado em 0,0 (pois o objeto graphics já está transladado)
    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i);
      const px = this.radius * Math.cos(angle);
      const py = this.radius * Math.sin(angle);
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  destroy() {
    this.graphics.destroy();
  }
}
