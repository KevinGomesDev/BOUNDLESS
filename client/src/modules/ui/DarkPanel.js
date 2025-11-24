import Phaser from "phaser";

export default class DarkPanel extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.panelWidth = width;
    this.panelHeight = height;

    // Adiciona este container à cena automaticamente
    scene.add.existing(this);

    this.draw();
  }

  draw() {
    const g = this.scene.add.graphics();

    // Como o gráfico está DENTRO do container, desenhamos relativo a 0,0
    // Mas para alinhar, vamos desenhar centralizado ou topo-esquerda?
    // Vamos desenhar relativo ao topo-esquerda do container.

    // Sombra (Drop Shadow) levemente deslocada
    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(15, 15, this.panelWidth, this.panelHeight, 16);

    // Fundo Principal (RGB 50, 50, 50 => 0x323232)
    g.fillStyle(0x323232, 1);
    g.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 16);

    // Borda Externa (Dourada/Metálica)
    g.lineStyle(3, 0xffd700, 0.8);
    g.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 16);

    // Borda Interna (Detalhe sutil)
    g.lineStyle(1, 0x666666, 0.5);
    g.strokeRoundedRect(10, 10, this.panelWidth - 20, this.panelHeight - 20, 8);

    this.add(g);
  }
}
