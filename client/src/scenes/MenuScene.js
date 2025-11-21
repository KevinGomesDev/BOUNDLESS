import Phaser from "phaser";
import { GameConfig } from "../config/GameConfig";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    const { width, height } = this.scale;

    // 1. Fundo Geral (Escuro para contraste com o painel)
    this.createBackground(width, height);

    // 2. Dimensões do Painel Central
    const panelWidth = 450;
    const panelHeight = 550;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    // Cria o visual do Painel (Fundo 50,50,50 + Bordas)
    this.createMenuPanel(panelX, panelY, panelWidth, panelHeight);

    // 3. Conteúdo do Menu (Centralizado em relação à tela)
    const centerX = width / 2;

    // Título "BATTLE REALMS"
    // Posicionado na parte superior do painel
    this.add
      .text(centerX, panelY + 60, "BATTLE REALMS", {
        fontFamily: "Arial",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#ffd700", // Dourado
        stroke: "#000000",
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000000",
          blur: 5,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Botões
    // O primeiro botão começa um pouco abaixo do título
    let currentY = panelY + 160;
    const buttonGap = 80;

    this.createStyledButton(centerX, currentY, "CRIAR SALA", () => {
      this.startGame();
    });

    this.createStyledButton(
      centerX,
      currentY + buttonGap,
      "ENTRAR EM SALA",
      () => {
        console.log("Entrar em sala: Em breve...");
      }
    );

    this.createStyledButton(
      centerX,
      currentY + buttonGap * 2,
      "SEUS REINOS",
      () => {
        console.log("Seus Reinos: Em breve...");
      }
    );

    this.createStyledButton(
      centerX,
      currentY + buttonGap * 3,
      "CONFIGURAÇÕES",
      () => {
        console.log("Configurações: Em breve...");
      }
    );
  }

  /**
   * Cria o fundo da tela com hexágonos decorativos sutis
   */
  createBackground(width, height) {
    // Fundo quase preto (Deep Dark Blue/Black)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050505, 0x050505, 0x101010, 0x101010, 1);
    bg.fillRect(0, 0, width, height);

    // Hexágonos flutuantes no fundo (efeito visual)
    const hexGraphics = this.add.graphics();
    hexGraphics.lineStyle(2, 0x333333, 0.2); // Cinza escuro, bem transparente

    for (let i = 0; i < 15; i++) {
      const rx = Phaser.Math.Between(0, width);
      const ry = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(40, 150);
      this.drawHex(hexGraphics, rx, ry, size);
    }
  }

  /**
   * Desenha a caixa do menu (Dark UI 50,50,50) com bordas
   */
  createMenuPanel(x, y, w, h) {
    const g = this.add.graphics();

    // Sombra (Drop Shadow)
    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(x + 15, y + 15, w, h, 16);

    // Fundo Principal (RGB 50, 50, 50 => 0x323232)
    g.fillStyle(0x323232, 1);
    g.fillRoundedRect(x, y, w, h, 16);

    // Borda Externa (Dourada/Metálica)
    g.lineStyle(3, 0xffd700, 0.8);
    g.strokeRoundedRect(x, y, w, h, 16);

    // Borda Interna (Detalhe sutil)
    g.lineStyle(1, 0x666666, 0.5);
    g.strokeRoundedRect(x + 10, y + 10, w - 20, h - 20, 8);
  }

  /**
   * Cria um botão com fundo, hover e clique
   */
  createStyledButton(x, y, text, callback) {
    // Configurações do botão
    const btnW = 300;
    const btnH = 55;
    const radius = 8;

    // Container para agrupar gráficos e texto
    const container = this.add.container(x, y);

    // Gráficos do fundo do botão
    const bg = this.add.graphics();
    const textObj = this.add
      .text(0, 0, text, {
        fontFamily: "Arial",
        fontSize: "18px",
        fontStyle: "bold",
        color: "#eeeeee",
      })
      .setOrigin(0.5);

    container.add([bg, textObj]);

    // Define tamanho da área interativa
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    // Função auxiliar para desenhar o estado do botão
    const drawState = (color, lineColor, scaleText) => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
      bg.lineStyle(2, lineColor, 1);
      bg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);

      if (scaleText) textObj.setScale(1.05);
      else textObj.setScale(1);
    };

    // Estado Inicial (Cinza Escuro)
    drawState(0x222222, 0x444444, false);

    // Eventos
    container.on("pointerover", () => {
      // Hover: Fundo mais claro, borda dourada
      drawState(0x444444, 0xffd700, true);
      textObj.setColor("#ffffff");
    });

    container.on("pointerout", () => {
      // Normal
      drawState(0x222222, 0x444444, false);
      textObj.setColor("#eeeeee");
    });

    container.on("pointerdown", () => {
      // Clique: Fundo preto
      drawState(0x000000, 0xffd700, true);
      this.tweens.add({
        targets: container,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
  }

  startGame() {
    console.log("Iniciando partida...");
    this.scene.start("GameScene");
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
