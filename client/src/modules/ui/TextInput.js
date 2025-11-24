import Phaser from "phaser";

export default class TextInput extends Phaser.GameObjects.Container {
  static focusedInput = null;

  constructor(scene, x, y, width, height, placeholder, isPassword = false) {
    super(scene, x, y);

    this.scene = scene;
    this.boxWidth = width;
    this.boxHeight = height;
    this.placeholder = placeholder;
    this.isPassword = isPassword;

    // CONFIGURAÇÃO: Margem interna do texto (Empurra o texto para a direita)
    this.paddingLeft = 20; // Se quiser EXATAMENTE 50px, mude para 50 aqui.

    this.textValue = "";
    this.hasFocus = false;
    this.cursorVisible = false;

    this.nextInput = null;
    this.onEnterCallback = null;
    this.keyListener = (event) => this.handleKey(event);

    scene.add.existing(this);

    // 1. Renderização Visual
    this.createBackground();
    this.createTextObject();
    this.createCursor();

    // 2. CORREÇÃO DA ÁREA DE CLIQUE (CRUCIAL)
    // Definimos explicitamente que a área clicável começa em 0,0 e vai até W,H
    // Isso alinha perfeitamente com o desenho do retângulo.
    this.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    // 3. Eventos de Mouse
    this.on("pointerover", () => {
      this.scene.game.canvas.style.cursor = "text";
    });

    this.on("pointerout", () => {
      this.scene.game.canvas.style.cursor = "default";
    });

    this.on("pointerdown", (pointer, localX, localY, event) => {
      event.stopPropagation();
      this.setFocus(true);
    });

    // Cursor piscando
    this.scene.time.addEvent({
      delay: 500,
      callback: () => this.blinkCursor(),
      loop: true,
    });

    this.on("destroy", () => {
      this.scene.game.canvas.style.cursor = "default";
      if (this.hasFocus) this.setFocus(false);
    });
  }

  // ... MÉTODOS PÚBLICOS IGUAIS ...
  setNextInput(inputInstance) {
    this.nextInput = inputInstance;
  }
  setOnEnter(callback) {
    this.onEnterCallback = callback;
  }
  getValue() {
    return this.textValue;
  }

  // ... LÓGICA DE FOCO IGUAL ...
  setFocus(bool) {
    if (this.hasFocus === bool) return;
    if (bool) {
      if (TextInput.focusedInput && TextInput.focusedInput !== this) {
        TextInput.focusedInput.setFocus(false);
      }
      TextInput.focusedInput = this;
      this.hasFocus = true;
      this.scene.input.keyboard.on("keydown", this.keyListener);
      this.scene.time.delayedCall(10, () => {
        this.scene.input.on("pointerdown", this.handleGlobalClick, this);
      });
    } else {
      this.hasFocus = false;
      if (TextInput.focusedInput === this) TextInput.focusedInput = null;
      this.scene.input.keyboard.off("keydown", this.keyListener);
      this.scene.input.off("pointerdown", this.handleGlobalClick, this);
    }
    this.updateVisuals();
    this.cursorVisible = bool;
    this.cursor.setVisible(bool);
  }

  handleGlobalClick(pointer, gameObjects) {
    if (!gameObjects.includes(this)) this.setFocus(false);
  }

  // --- VISUAL ---

  createBackground() {
    this.bg = this.scene.add.graphics();
    this.updateVisuals();
    this.add(this.bg);
  }

  createTextObject() {
    // Texto usando o paddingLeft definido no construtor
    this.displayObj = this.scene.add
      .text(this.paddingLeft, this.boxHeight / 2, this.placeholder, {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0, 0.5); // Alinha à esquerda verticalmente centrado
    this.add(this.displayObj);
  }

  createCursor() {
    // Cursor começa na posição do padding
    this.cursor = this.scene.add
      .rectangle(this.paddingLeft, this.boxHeight / 2, 2, 20, 0xffd700)
      .setOrigin(0, 0.5);
    this.cursor.setVisible(false);
    this.add(this.cursor);
  }

  blinkCursor() {
    if (this.hasFocus) {
      this.cursorVisible = !this.cursorVisible;
      this.cursor.setVisible(this.cursorVisible);
    } else {
      this.cursor.setVisible(false);
    }
  }

  updateVisuals() {
    this.bg.clear();
    const color = this.hasFocus ? 0x222222 : 0x111111;
    this.bg.fillStyle(color, 1);
    this.bg.fillRoundedRect(0, 0, this.boxWidth, this.boxHeight, 8);

    const strokeColor = this.hasFocus ? 0xffd700 : 0x444444;
    this.bg.lineStyle(2, strokeColor, 1);
    this.bg.strokeRoundedRect(0, 0, this.boxWidth, this.boxHeight, 8);
  }

  // --- TECLADO ---

  async handleKey(event) {
    if (!this.hasFocus) return;
    const ctrlDown = event.ctrlKey || event.metaKey;
    const key = event.key;

    if (ctrlDown && key.toLowerCase() === "a") {
      event.preventDefault();
      this.isAllSelected = true;
      this.updateTextDisplay();
      return;
    }
    if (ctrlDown && key.toLowerCase() === "c") {
      if (this.textValue)
        navigator.clipboard.writeText(this.textValue).catch((e) => {});
      return;
    }
    if (ctrlDown && key.toLowerCase() === "x") {
      if (this.textValue) {
        navigator.clipboard.writeText(this.textValue);
        this.textValue = "";
        this.isAllSelected = false;
        this.updateTextDisplay();
      }
      return;
    }
    if (ctrlDown && key.toLowerCase() === "v") {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (this.isAllSelected) {
            this.textValue = text;
            this.isAllSelected = false;
          } else {
            this.textValue += text;
          }
          this.updateTextDisplay();
        }
      } catch (e) {}
      return;
    }

    if (key === "Tab") {
      event.preventDefault();
      this.isAllSelected = false;
      if (this.nextInput) this.nextInput.setFocus(true);
      else this.setFocus(false);
      return;
    }
    if (key === "Enter") {
      if (this.onEnterCallback) this.onEnterCallback();
      return;
    }
    if (key === "Backspace" || key === "Delete") {
      if (this.isAllSelected) {
        this.textValue = "";
        this.isAllSelected = false;
      } else if (key === "Backspace" && this.textValue.length > 0) {
        this.textValue = this.textValue.slice(0, -1);
      }
      this.updateTextDisplay();
      return;
    }

    if (key.length === 1 && !ctrlDown) {
      if (this.isAllSelected) {
        this.textValue = key;
        this.isAllSelected = false;
      } else if (this.textValue.length < 200) {
        this.textValue += key;
      }
      this.updateTextDisplay();
    }
  }

  updateTextDisplay() {
    let content = this.textValue;
    if (this.isPassword && content.length > 0) {
      content = "*".repeat(content.length);
    }

    if (content.length === 0) {
      this.displayObj.setText(this.placeholder);
      this.displayObj.setColor("#888888");
    } else {
      this.displayObj.setText(content);
      this.displayObj.setColor("#ffffff");
    }

    // Calcula a posição do cursor baseado no tamanho do texto + padding
    const textWidth = this.displayObj.width;
    const cursorX =
      content.length === 0 ? this.paddingLeft : this.paddingLeft + textWidth;
    this.cursor.x = cursorX;
  }
}
