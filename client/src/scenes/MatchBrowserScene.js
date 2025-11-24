import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import DarkPanel from "../modules/ui/DarkPanel";
import TextButton from "../modules/ui/TextButton";
import CycleButton from "../modules/ui/CycleButton"; // Para escolher reino ao entrar
import socketService from "../services/SocketService";

export class MatchBrowserScene extends Phaser.Scene {
  constructor() {
    super({ key: "MatchBrowserScene" });
  }

  create() {
    new HexBackground(this).create();
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add
      .text(cx, 50, "PARTIDAS ABERTAS", {
        font: "32px Arial",
        color: "#ffd700",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Lista de Partidas
    this.listContainer = this.add.container(0, 100);

    // Modal de "Escolher Reino para Entrar" (Invisível inicialmente)
    this.createJoinModal();

    // Botão Voltar
    new TextButton(
      this,
      cx,
      height - 60,
      "VOLTAR AO MENU",
      () => this.scene.start("MenuScene"),
      250,
      50
    );

    // Pede a lista
    this.refreshList();

    // Listener de início de jogo (caso o join dê certo)
    socketService.on("match:started", ({ matchId }) => {
      this.registry.set("currentMatchId", matchId);
      socketService.off("match:started");
      socketService.off("match:list_result");
      this.scene.start("GameScene");
    });
  }

  refreshList() {
    socketService.once("match:list_result", (matches) => {
      this.renderList(matches);
    });
    socketService.emit("match:list_open");
  }

  renderList(matches) {
    this.listContainer.removeAll(true);

    if (matches.length === 0) {
      this.add
        .text(this.scale.width / 2, 200, "Nenhuma sala encontrada.", {
          color: "#888",
        })
        .setOrigin(0.5);
      return;
    }

    let y = 0;
    matches.forEach((m) => {
      const bg = this.add.graphics();
      bg.fillStyle(0x222222, 0.8);
      bg.fillRoundedRect(this.scale.width / 2 - 250, y, 500, 60, 8);
      bg.lineStyle(2, 0x444444);
      bg.strokeRoundedRect(this.scale.width / 2 - 250, y, 500, 60, 8);

      const text = this.add.text(
        this.scale.width / 2 - 230,
        y + 20,
        `Host: ${m.hostName} | Reino: ${m.kingdomName}`,
        { fontSize: "16px", color: "#fff" }
      );

      const btnJoin = this.add
        .text(this.scale.width / 2 + 180, y + 20, "ENTRAR", {
          fontSize: "16px",
          color: "#0f0",
          fontStyle: "bold",
        })
        .setInteractive({ useHandCursor: true });

      btnJoin.on("pointerdown", () => {
        this.openJoinModal(m.id);
      });

      this.listContainer.add([bg, text, btnJoin]);
      y += 70;
    });
  }

  // --- MODAL DE ENTRADA ---
  // O jogador precisa escolher com qual reino vai jogar antes de entrar
  createJoinModal() {
    const { width, height } = this.scale;
    this.modalContainer = this.add
      .container(0, 0)
      .setVisible(false)
      .setDepth(100);

    // Fundo escuro bloqueando cliques atrás
    const blocker = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.8)
      .setInteractive();

    // Painel
    const panel = new DarkPanel(
      this,
      width / 2 - 200,
      height / 2 - 150,
      400,
      300
    );

    const title = this.add
      .text(width / 2, height / 2 - 110, "PREPARAR EXÉRCITO", {
        fontSize: "20px",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.modalContainer.add([blocker, panel, title]);

    // Vai ser populado quando abrir
    this.kingdomSelector = null;
    this.targetMatchId = null;
  }

  openJoinModal(matchId) {
    this.targetMatchId = matchId;
    this.modalContainer.setVisible(true);

    // Carrega reinos do usuário
    const userId = this.registry.get("userId");
    socketService.once("kingdom:list_success", (kingdoms) => {
      this.populateJoinModal(kingdoms);
    });
    socketService.emit("kingdom:list", { userId });
  }

  populateJoinModal(kingdoms) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    if (kingdoms.length === 0) {
      const txt = this.add
        .text(cx, cy, "Você não tem reinos!", { color: "#f55" })
        .setOrigin(0.5);
      this.modalContainer.add(txt);
      return;
    }

    const names = kingdoms.map((k) => k.name);

    // Seletor
    if (this.kingdomSelector) this.kingdomSelector.destroy();
    this.kingdomSelector = new CycleButton(this, cx, cy - 20, "Usar", names);
    this.modalContainer.add(this.kingdomSelector);

    // Botão Confirmar
    const btnConfirm = new TextButton(this, cx, cy + 80, "BATALHAR!", () => {
      const selectedIndex = this.kingdomSelector.currentIndex;
      const kingdomId = kingdoms[selectedIndex].id;
      const userId = this.registry.get("userId");

      socketService.emit("match:join", {
        matchId: this.targetMatchId,
        userId,
        kingdomId,
      });

      // Feedback
      btnConfirm.textObj.setText("ENTRANDO...");
    });
    this.modalContainer.add(btnConfirm);

    // Botão Cancelar
    const btnCancel = this.add
      .text(cx, cy + 130, "Cancelar", { color: "#aaa" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btnCancel.on("pointerdown", () => this.modalContainer.setVisible(false));
    this.modalContainer.add(btnCancel);
  }
}
