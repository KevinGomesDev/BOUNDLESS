import Phaser from "phaser";

export default class TextButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, callback, width = 300, height = 55) {
    super(scene, x, y);

    this.scene = scene;
    this.callback = callback;
    this.btnW = width;
    this.btnH = height;
    this.textString = text;
    this.radius = 8;

    this.buildButton();

    // Torna interativo e define tamanho do hit area
    this.setSize(this.btnW, this.btnH);
    this.setInteractive({ useHandCursor: true });

    // Liga eventos
    this.setupEvents();

    scene.add.existing(this);
  }

  buildButton() {
    // Fundo
    this.bg = this.scene.add.graphics();

    // Texto
    this.textObj = this.scene.add
      .text(0, 0, this.textString, {
        fontFamily: "Arial",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#eeeeee",
      })
      .setOrigin(0.5);

    this.add([this.bg, this.textObj]);

    // Desenha estado inicial
    this.updateVisuals(0x222222, 0x444444, false);
  }

  updateVisuals(fillColor, strokeColor, scaleText) {
    this.bg.clear();
    this.bg.fillStyle(fillColor, 1);
    this.bg.fillRoundedRect(
      -this.btnW / 2,
      -this.btnH / 2,
      this.btnW,
      this.btnH,
      this.radius
    );
    this.bg.lineStyle(2, strokeColor, 1);
    this.bg.strokeRoundedRect(
      -this.btnW / 2,
      -this.btnH / 2,
      this.btnW,
      this.btnH,
      this.radius
    );

    this.textObj.setScale(scaleText ? 1.05 : 1);
    this.textObj.setColor(scaleText ? "#ffffff" : "#eeeeee");
  }

  setupEvents() {
    this.on("pointerover", () => {
      this.updateVisuals(0x444444, 0xffd700, true);
    });

    this.on("pointerout", () => {
      this.updateVisuals(0x222222, 0x444444, false);
    });

    this.on("pointerdown", () => {
      this.updateVisuals(0x000000, 0xffd700, true);

      // Pequena animação de clique
      this.scene.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          if (this.callback) this.callback();
        },
      });
    });
  }
}
