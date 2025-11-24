import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import DarkPanel from "../modules/ui/DarkPanel";
import TextButton from "../modules/ui/TextButton";
import socketService from "../services/SocketService";

export class KingdomsScene extends Phaser.Scene {
  constructor() {
    super({ key: "KingdomsScene" });
  }

  create() {
    new HexBackground(this).create();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Painel Grande
    new DarkPanel(this, cx - 300, cy - 300, 600, 600);

    this.add
      .text(cx, cy - 200, "MEUS REINOS", {
        font: "32px Arial",
        fill: "#ffd700",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Container para a lista (futuramente pode ter scroll)
    this.listContainer = this.add.container(0, 0);

    // Texto de "Carregando..."
    this.loadingText = this.add
      .text(cx, cy, "Consultando escribas...", { color: "#aaa" })
      .setOrigin(0.5);

    // Botões Fixos em Baixo
    new TextButton(this, cx, cy + 180, "NOVO REINO", () => {
      this.scene.start("KingdomCreationScene");
    });

    new TextButton(
      this,
      cx,
      cy + 180 + 70,
      "VOLTAR AO MENU",
      () => {
        this.scene.start("MenuScene");
      },
      200,
      40
    );

    // --- SOCKETS ---
    this.setupSocket();

    // Pede a lista assim que entra
    const userId = this.registry.get("userId");
    socketService.emit("kingdom:list", { userId });
  }

  setupSocket() {
    socketService.on("kingdom:list_success", (kingdoms) => {
      this.loadingText.destroy(); // Remove carregando
      this.renderList(kingdoms);
    });
  }

  renderList(kingdoms) {
    const { width, height } = this.scale;
    const cx = width / 2;
    let startY = height / 2 - 200;

    if (kingdoms.length === 0) {
      this.add
        .text(
          cx,
          height / 2,
          "Nenhum reino encontrado.\nComece sua história!",
          {
            align: "center",
            color: "#888",
          }
        )
        .setOrigin(0.5);
      return;
    }

    kingdoms.forEach((k) => {
      // Cria uma "tira" visual para cada reino
      const card = this.createKingdomCard(cx, startY, k);
      this.listContainer.add(card);
      startY += 80; // Espaço entre cards
    });
  }

  createKingdomCard(x, y, kingdom) {
    const container = this.add.container(x, y);

    // Fundo do Card
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 1);
    bg.fillRoundedRect(-250, -35, 500, 70, 8);
    bg.lineStyle(2, 0x444444);
    bg.strokeRoundedRect(-250, -35, 500, 70, 8);

    // Textos
    const nameText = this.add.text(-230, -20, kingdom.name.toUpperCase(), {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffd700",
    });

    const infoText = this.add.text(
      -230,
      5,
      `Capital: ${kingdom.capitalName} | Raça: ${kingdom.race}`,
      {
        fontSize: "14px",
        color: "#cccccc",
      }
    );

    // Botão "Selecionar" (Pequeno na direita)
    // Aqui usamos um TextButton mas ajustado manualmente ou criamos um gráfico simples
    // Vamos fazer um texto interativo simples para economizar espaço
    const btnSelect = this.add
      .text(180, 0, "GERENCIAR", {
        fontSize: "14px",
        color: "#00ff00",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnSelect.on("pointerdown", () => {
      console.log("Selecionou reino:", kingdom.id);
      // Futuro: Abrir detalhes ou selecionar para jogar
    });

    container.add([bg, nameText, infoText, btnSelect]);
    return container;
  }
}
