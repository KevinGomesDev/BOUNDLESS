// client/src/scenes/MenuScene.js
import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import DarkPanel from "../modules/ui/DarkPanel";
import TextButton from "../modules/ui/TextButton";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    new HexBackground(this).create();

    // Tenta pegar do registry, se não tiver, pega do localStorage
    let username = this.registry.get("username");
    let userId = this.registry.get("userId");

    if (!userId) {
      // Recupera do backup
      userId = localStorage.getItem("userId");
      username = localStorage.getItem("username");

      // Se recuperou, salva no registry de volta
      if (userId) {
        this.registry.set("userId", userId);
        this.registry.set("username", username);
      } else {
        // Se não tem nem no storage, chuta o usuário pro login
        this.scene.start("EntryScene");
        return;
      }
    }

    const { width, height } = this.scale;
    const panelW = 450;
    const panelH = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelTopY = centerY - panelH / 2;

    new DarkPanel(this, centerX - panelW / 2, panelTopY, panelW, panelH);

    // Título e Boas-vindas
    this.createTitle(centerX, panelTopY + 60);
    this.add
      .text(centerX, panelTopY + 110, `Bem-vindo, ${username}!`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    // --- CORREÇÃO DE ALINHAMENTO ---
    const btnH = 55;
    const gap = 25;
    const numButtons = 4;

    // Calculamos a altura total que a pilha de botões ocupa
    const totalGroupHeight = btnH * numButtons + gap * (numButtons - 1);

    // Queremos que o CENTRO do grupo de botões fique um pouco abaixo do centro da tela (+40px)
    // para compensar o título lá em cima.
    const groupCenterY = centerY + 40;

    // A posição inicial (Y do primeiro botão) é o centro do grupo menos metade da altura total
    const startY = groupCenterY - totalGroupHeight / 2;

    this.createButtons(centerX, startY, btnH, gap);
  }

  createTitle(x, y) {
    this.add
      .text(x, y, "BATTLE REALMS", {
        fontFamily: "Arial",
        fontSize: "38px",
        fontStyle: "bold",
        color: "#ffd700",
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
  }

  createButtons(x, startY, btnH, gap) {
    // BOTÃO 1
    new TextButton(this, x, startY, "CRIAR NOVA SALA", () => {
      console.log("Criar sala...");
      this.scene.start("GameScene");
    });

    // BOTÃO 2
    new TextButton(
      this,
      x,
      startY + (btnH + gap),
      "ENTRAR EM SALA EXISTENTE",
      () => {
        console.log("Lista de salas...");
      }
    );

    // BOTÃO 3
    new TextButton(this, x, startY + (btnH + gap) * 2, "MEUS REINOS", () => {
      this.scene.start("KingdomsScene"); // <--- Conecta aqui
    });

    // BOTÃO 4
    new TextButton(this, x, startY + (btnH + gap) * 3, "CONFIGURAÇÕES", () =>
      console.log("Config")
    );
  }
}
