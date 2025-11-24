import TextButton from "./TextButton";

export default class CycleButton extends TextButton {
  constructor(scene, x, y, label, options, width = 300, height = 50) {
    // Começa com a primeira opção
    super(scene, x, y, `${label}: ${options[0]}`, null, width, height);

    this.labelPrefix = label;
    this.options = options;
    this.currentIndex = 0;

    // Sobrescreve o callback
    this.callback = () => {
      this.currentIndex = (this.currentIndex + 1) % this.options.length;
      this.updateText();
    };

    // Atualiza o comportamento de clique
    this.off("pointerdown"); // Remove o listener do pai para não duplicar
    this.on("pointerdown", () => {
      this.updateVisuals(0x000000, 0xffd700, true);
      this.scene.tweens.add({
        targets: this,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: this.callback,
      });
    });
  }

  updateText() {
    this.textObj.setText(
      `${this.labelPrefix}: ${this.options[this.currentIndex]}`
    );
  }

  getValue() {
    return this.options[this.currentIndex];
  }
}
