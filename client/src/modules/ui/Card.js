import Phaser from "phaser";
import TextButton from "./TextButton";

export default class Card extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.scene = scene;
    this.cardW = width;
    this.cardH = height;

    this.currentData = null;

    // Renderiza a estrutura vazia
    this.createVisuals();

    // Adiciona à cena
    scene.add.existing(this);
  }

  createVisuals() {
    const w = this.cardW;
    const h = this.cardH;

    // 1. Fundo do Card
    this.bg = this.scene.add.graphics();

    // 2. Área da Imagem (Topo)
    this.imageRect = this.scene.add.rectangle(
      0,
      -h * 0.25,
      w - 40,
      h * 0.4,
      0x000000
    );
    this.imageRect.setStrokeStyle(2, 0xffd700);

    // 3. Título (Nome da Raça)
    this.titleText = this.scene.add
      .text(0, 20, "", {
        fontFamily: "Arial",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // 4. Descrição (Lore)
    this.descText = this.scene.add
      .text(0, 70, "", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#cccccc",
        align: "center",
        wordWrap: { width: w - 60 },
      })
      .setOrigin(0.5, 0);

    // 5. Passiva
    this.passiveTitle = this.scene.add
      .text(0, 180, "", {
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.passiveDesc = this.scene.add
      .text(0, 210, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#aaaaff",
        align: "center",
        fontStyle: "italic",
        wordWrap: { width: w - 60 },
      })
      .setOrigin(0.5, 0);

    // Adiciona tudo ao container
    this.add([
      this.bg,
      this.imageRect,
      this.titleText,
      this.descText,
      this.passiveTitle,
      this.passiveDesc,
    ]);
  }

  // Preenche os textos
  populate(raceData) {
    this.currentData = raceData;
    const color = raceData.color || 0xffd700;

    // Atualiza Fundo
    this.bg.clear();
    this.bg.fillStyle(0x1a1a1a, 1);
    this.bg.fillRoundedRect(
      -this.cardW / 2,
      -this.cardH / 2,
      this.cardW,
      this.cardH,
      16
    );
    this.bg.lineStyle(4, color);
    this.bg.strokeRoundedRect(
      -this.cardW / 2,
      -this.cardH / 2,
      this.cardW,
      this.cardH,
      16
    );

    // Atualiza Imagem Placeholder
    this.imageRect.fillColor = color;
    this.imageRect.setAlpha(0.3); // Leve transparência

    // Atualiza Textos
    this.titleText
      .setText(raceData.name.toUpperCase())
      .setColor(`#${color.toString(16)}`);
    this.descText.setText(raceData.description);
    this.passiveTitle.setText(raceData.passiveName);
    this.passiveDesc.setText(raceData.passiveEffect);
  }

  // Define se é o Card Principal ou um Preview
  setMode(mode) {
    // Mode: 'CENTER' | 'SIDE'

    if (mode === "CENTER") {
      this.setAlpha(1);
      this.setScale(1);
      this.setDepth(10); // Traz para frente
      // Filtro de cor normal
      this.titleText.setAlpha(1);
      this.descText.setAlpha(1);
    } else {
      // Modo Preview (Obscurecido)
      this.setAlpha(0.4); // Bem transparente
      this.setScale(0.75); // Menor
      this.setDepth(1); // Manda para trás
      // Esconde detalhes para não poluir
      this.descText.setAlpha(0);
      this.passiveDesc.setAlpha(0);
    }
  }
}
