import Phaser from "phaser";

export default class HexBackground {
  constructor(scene) {
    this.scene = scene;
    this.width = scene.scale.width;
    this.height = scene.scale.height;
  }

  create() {
    // 1. Fundo Gradiente Escuro
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0x050505, 0x050505, 0x101010, 0x101010, 1);
    bg.fillRect(0, 0, this.width, this.height);

    // 2. Hexágonos Decorativos
    const hexGraphics = this.scene.add.graphics();
    hexGraphics.lineStyle(2, 0x333333, 0.2); // Cinza escuro, transparente

    for (let i = 0; i < 15; i++) {
      const rx = Phaser.Math.Between(0, this.width);
      const ry = Phaser.Math.Between(0, this.height);
      const size = Phaser.Math.Between(40, 150);
      this.drawHex(hexGraphics, rx, ry, size);
    }
  }

  drawHex(graphics, x, y, radius) {
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i);
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.closePath();
    graphics.strokePath();
  }
}
