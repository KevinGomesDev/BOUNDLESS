import Phaser from "phaser";
import Card from "./Card";
import TextButton from "./TextButton";

export default class CardSelector extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.scene = scene;

    // Dimensões aumentadas para o Card Principal
    this.cardWidth = 400;
    this.cardHeight = 550;

    this.racesData = [];
    this.currentIndex = 0;
    this.onSelectCallback = null;

    scene.add.existing(this);

    this.createStructure();
  }

  createStructure() {
    // Cria as 3 instâncias de cards
    // Ordem de adição importa para o Depth inicial, mas setMode ajusta depois

    // Card Esquerda (Anterior)
    this.cardPrev = new Card(this.scene, 0, 0, this.cardWidth, this.cardHeight);

    // Card Direita (Próximo)
    this.cardNext = new Card(this.scene, 0, 0, this.cardWidth, this.cardHeight);

    // Card Centro (Atual)
    this.cardCurrent = new Card(
      this.scene,
      0,
      0,
      this.cardWidth,
      this.cardHeight
    );

    this.add([this.cardPrev, this.cardNext, this.cardCurrent]);

    // Botões de Navegação (Setas Gigantes)
    // Posicionados bem nas bordas do componente
    this.createArrow(-350, 0, "<", () => this.prev());
    this.createArrow(350, 0, ">", () => this.next());

    // Botão de Seleção (Apenas para o card do meio)
    this.btnSelect = new TextButton(
      this.scene,
      0,
      this.cardHeight / 2 + 60,
      "ESCOLHER ESTA RAÇA",
      () => {
        if (this.onSelectCallback && this.racesData.length > 0) {
          this.onSelectCallback(this.racesData[this.currentIndex]);
        }
      },
      300,
      60
    ); // Botão maior
    this.add(this.btnSelect);
  }

  createArrow(x, y, char, callback) {
    const arrow = this.scene.add
      .text(x, y, char, {
        fontSize: "80px",
        color: "#ffd700",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    arrow.on("pointerdown", () => {
      this.scene.tweens.add({
        targets: arrow,
        scale: 0.8,
        duration: 50,
        yoyo: true,
      });
      callback();
    });

    this.add(arrow);
  }

  setRaces(data) {
    this.racesData = data;
    this.currentIndex = 0;
    this.updateCarousel();
  }

  setOnSelect(callback) {
    this.onSelectCallback = callback;
  }

  // A Lógica Mágica do Carrossel
  updateCarousel() {
    if (this.racesData.length === 0) return;

    const total = this.racesData.length;

    // 1. Calcula os índices (Circular)
    const iCurrent = this.currentIndex;
    // Se i=0, prev é o último do array.
    const iPrev = (this.currentIndex - 1 + total) % total;
    const iNext = (this.currentIndex + 1) % total;

    // 2. Preenche os Dados
    this.cardCurrent.populate(this.racesData[iCurrent]);
    this.cardPrev.populate(this.racesData[iPrev]);
    this.cardNext.populate(this.racesData[iNext]);

    // 3. Define os Modos (Visual)
    this.cardCurrent.setMode("CENTER");
    this.cardPrev.setMode("SIDE");
    this.cardNext.setMode("SIDE");

    // 4. Posicionamento Responsivo
    // Centro: 0,0 (relativo ao container)
    this.cardCurrent.setPosition(0, 0);

    // Lados: Afastados X pixels do centro
    const spacing = 380; // Distância do centro
    this.cardPrev.setPosition(-spacing, 0);
    this.cardNext.setPosition(spacing, 0);
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.racesData.length;
    this.updateCarousel();
  }

  prev() {
    this.currentIndex =
      (this.currentIndex - 1 + this.racesData.length) % this.racesData.length;
    this.updateCarousel();
  }
}
