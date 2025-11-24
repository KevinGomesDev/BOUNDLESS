import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import DarkPanel from "../modules/ui/DarkPanel";
import TextButton from "../modules/ui/TextButton";
import CycleButton from "../modules/ui/CycleButton";
import socketService from "../services/SocketService";

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: "LobbyScene" });
  }

  create() {
    new HexBackground(this).create();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    new DarkPanel(this, cx - 250, cy - 200, 500, 400);

    // Título
    this.title = this.add
      .text(cx, cy - 160, "CONFIGURAR BATALHA", {
        font: "28px Arial",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Container de Loading (Inicial)
    this.loadingText = this.add
      .text(cx, cy, "Buscando seus exércitos...", { color: "#aaa" })
      .setOrigin(0.5);

    // Variável para guardar o reino selecionado
    this.selectedKingdomId = null;
    this.myKingdoms = [];

    // --- LÓGICA ---
    // 1. Pede a lista de reinos do usuário para ele escolher
    const userId = this.registry.get("userId");

    socketService.once("kingdom:list_success", (kingdoms) => {
      this.loadingText.destroy();
      if (kingdoms.length === 0) {
        this.showNoKingdoms(cx, cy);
      } else {
        this.myKingdoms = kingdoms;
        this.showConfigUI(cx, cy);
      }
    });

    socketService.emit("kingdom:list", { userId });

    // Listeners de Partida
    this.setupMatchListeners();
  }

  showConfigUI(x, y) {
    // Texto
    this.add
      .text(x, y - 80, "Escolha seu Reino:", {
        fontSize: "18px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Cycle Button com os nomes dos reinos
    const kingdomNames = this.myKingdoms.map((k) => `${k.name} (${k.race})`);

    const selector = new CycleButton(this, x, y - 30, "Reino", kingdomNames);
    this.add.existing(selector);

    // Botão de Criar
    this.btnCreate = new TextButton(
      this,
      x,
      y + 100,
      "CRIAR SALA E ESPERAR",
      () => {
        // Descobre qual ID está selecionado baseado no index do cycle button
        const selectedIndex = selector.currentIndex;
        this.selectedKingdomId = this.myKingdoms[selectedIndex].id;

        this.createMatch();
      }
    );

    // Botão Voltar
    new TextButton(
      this,
      x,
      y + 160,
      "VOLTAR",
      () => this.scene.start("MenuScene"),
      200,
      40
    );
  }

  showNoKingdoms(x, y) {
    this.add
      .text(x, y, "Você não possui Reinos!\nCrie um antes de batalhar.", {
        align: "center",
        color: "#f55",
      })
      .setOrigin(0.5);
    new TextButton(this, x, y + 80, "CRIAR REINO", () =>
      this.scene.start("KingdomCreationScene")
    );
    new TextButton(
      this,
      x,
      y + 140,
      "VOLTAR",
      () => this.scene.start("MenuScene"),
      200,
      40
    );
  }

  createMatch() {
    const userId = this.registry.get("userId");
    this.btnCreate.textObj.setText("CRIANDO MAPA...");

    socketService.emit("match:create", {
      userId,
      kingdomId: this.selectedKingdomId,
    });
  }

  setupMatchListeners() {
    // 1. Sala Criada com Sucesso -> Muda UI para "Esperando"
    socketService.on("match:created_success", ({ matchId }) => {
      this.registry.set("currentMatchId", matchId);
      this.showWaitingScreen();
    });

    // 2. Oponente Entrou -> Começa o jogo!
    socketService.on("match:started", ({ matchId }) => {
      // Limpa listeners para não duplicar na volta
      socketService.off("match:created_success");
      socketService.off("match:started");

      this.scene.start("GameScene");
    });
  }

  showWaitingScreen() {
    // Limpa o painel atual
    this.children.removeAll();
    new HexBackground(this).create(); // Redesenha fundo

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    new DarkPanel(this, cx - 200, cy - 100, 400, 200);

    this.add
      .text(cx, cy - 40, "SALA CRIADA!", {
        fontSize: "24px",
        color: "#0f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy + 10, "Aguardando oponente...", {
        fontSize: "18px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Animação simples de pontinhos...
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 1000,
      loop: -1,
      yoyo: true,
      onUpdate: (tween) => {
        const val = tween.getValue();
        this.add
          .graphics()
          .clear()
          .fillStyle(0xffd700, val / 100)
          .fillCircle(cx, cy + 50, 5);
      },
    });
  }
}
