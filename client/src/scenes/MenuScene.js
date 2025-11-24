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
    // 1. Fundo (Pode desenhar logo para não ficar tela preta)
    new HexBackground(this).create();

    // 2. Recupera Sessão
    let username = this.registry.get("username");
    let userId = this.registry.get("userId");

    // Lógica de recuperação do LocalStorage (F5)
    if (!userId) {
      userId = localStorage.getItem("userId");
      username = localStorage.getItem("username");

      if (userId) {
        this.registry.set("userId", userId);
        this.registry.set("username", username);
      } else {
        this.scene.start("EntryScene");
        return;
      }
    }

    // 3. LOADING STATE (Enquanto verifica se tem partida)
    this.loadingText = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        "Verificando campo de batalha...",
        {
          font: "20px Arial",
          color: "#aaa",
        }
      )
      .setOrigin(0.5);

    // 4. PERGUNTA AO SERVIDOR
    this.checkActiveSession(userId);
  }

  checkActiveSession(userId) {
    // Escuta a resposta (apenas uma vez)
    socketService.once("auth:session_checked", ({ activeMatchId }) => {
      this.loadingText.destroy(); // Remove o texto de loading

      if (activeMatchId) {
        // CASO A: Tem partida ativa -> Vai direto pro jogo
        console.log("Reconectando à partida:", activeMatchId);
        this.registry.set("currentMatchId", activeMatchId);
        this.scene.start("GameScene");
      } else {
        // CASO B: Livre -> Desenha o Menu normal
        this.showMenuUI();
      }
    });

    // Envia a pergunta
    socketService.emit("auth:check_session", { userId });
  }

  // Movemos toda a criação visual antiga para este método
  showMenuUI() {
    const username = this.registry.get("username");
    const { width, height } = this.scale;

    // ... (Código do Painel, Título e Botões que você já tinha) ...
    const panelW = 450;
    const panelH = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const panelTopY = centerY - panelH / 2;

    new DarkPanel(this, centerX - panelW / 2, panelTopY, panelW, panelH);

    this.createTitle(centerX, panelTopY + 60);

    this.add
      .text(centerX, panelTopY + 110, `Bem-vindo, ${username}!`, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    // Botões
    const btnH = 55;
    const gap = 25;
    const numButtons = 4;
    const totalGroupHeight = btnH * numButtons + gap * (numButtons - 1);
    const groupCenterY = centerY + 40;
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
    // BOTÃO 1: NOVA PARTIDA (Vai para o Lobby de Configuração)
    new TextButton(this, x, startY, "NOVA PARTIDA", () => {
      this.scene.start("LobbyScene");
    });

    // BOTÃO 2: PROCURAR PARTIDA (Vai para a Lista)
    new TextButton(this, x, startY + (btnH + gap), "PROCURAR PARTIDA", () => {
      this.scene.start("MatchBrowserScene");
    });

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
