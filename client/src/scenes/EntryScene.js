import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import DarkPanel from "../modules/ui/DarkPanel";
import TextButton from "../modules/ui/TextButton";
import TextInput from "../modules/ui/TextInput";
import socketService from "../services/SocketService";

export class EntryScene extends Phaser.Scene {
  constructor() {
    super({ key: "EntryScene" });
  }

  create() {
    new HexBackground(this).create();

    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. VERIFICAÇÃO DE SESSÃO EXISTENTE (AUTO-LOGIN)
    const savedUserId = localStorage.getItem("userId");
    const savedUsername = localStorage.getItem("username");

    if (savedUserId) {
      // Se já tem ID, mostra "Carregando" e verifica sessão
      this.showLoadingState(centerX, centerY, savedUsername);
      this.checkSession(savedUserId);
    } else {
      // Se não tem ID, mostra os formulários de Login/Registro
      this.showAuthForms(centerX, centerY);
    }

    // Setup dos listeners globais (sucesso/erro)
    this.setupSocketEvents();
  }

  // --- ESTADO DE CARREGAMENTO (AUTO-LOGIN) ---
  showLoadingState(x, y, username) {
    this.add
      .text(x, y - 50, "BATTLE REALMS", {
        fontFamily: "Arial",
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.loadingText = this.add
      .text(x, y + 50, `Bem-vindo de volta, ${username || "Viajante"}...`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#aaa",
      })
      .setOrigin(0.5);

    // Animação simples
    this.tweens.add({
      targets: this.loadingText,
      alpha: 0.5,
      duration: 800,
      yoyo: true,
      loop: -1,
    });
  }

  checkSession(userId) {
    // Salva no registry para garantir
    this.registry.set("userId", userId);
    this.registry.set("username", localStorage.getItem("username"));

    // Pergunta ao servidor se há partida ativa
    // Usamos 'once' porque é uma verificação única
    socketService.once("auth:session_checked", ({ activeMatchId }) => {
      if (activeMatchId) {
        console.log("Reconectando ao jogo:", activeMatchId);
        this.registry.set("currentMatchId", activeMatchId);
        this.scene.start("GameScene");
      } else {
        console.log("Sessão válida, indo para Menu.");
        this.scene.start("MenuScene");
      }
    });

    // Envia pedido
    socketService.emit("auth:check_session", { userId });
  }

  // --- ESTADO DE FORMULÁRIOS (LOGIN/REGISTRO) ---
  showAuthForms(centerX, centerY) {
    // --- Layout ---
    const panelW = 350;
    const panelH = 450;
    const gap = 40;
    const startY = centerY - panelH / 2;

    const leftPanelX = centerX - panelW - gap / 2;
    const rightPanelX = centerX + gap / 2;

    // Feedback de Erro
    this.errorText = this.add
      .text(centerX, startY - 50, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ff5555",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Título
    this.add
      .text(centerX, startY - 100, "BATTLE REALMS", {
        fontFamily: "Arial",
        fontSize: "42px",
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

    this.createLoginBlock(leftPanelX, startY, panelW, panelH);
    this.createRegisterBlock(rightPanelX, startY, panelW, panelH);
  }

  createLoginBlock(x, y, w, h) {
    new DarkPanel(this, x, y, w, h);
    const cx = x + w / 2;
    let cy = y + 50;

    this.add
      .text(cx, cy, "LOGIN", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    cy += 70;
    this.loginUser = new TextInput(this, cx - 140, cy, 280, 50, "Usuário");
    cy += 70;
    this.loginPass = new TextInput(this, cx - 140, cy, 280, 50, "Senha", true);

    // Navegação
    this.loginUser.setNextInput(this.loginPass);
    this.loginPass.setNextInput(this.loginUser);
    const triggerLogin = () => this.handleLogin();
    this.loginUser.setOnEnter(triggerLogin);
    this.loginPass.setOnEnter(triggerLogin);

    cy += 100;
    this.btnLogin = new TextButton(
      this,
      cx,
      cy,
      "ENTRAR",
      () => this.handleLogin(),
      280,
      55
    );
  }

  createRegisterBlock(x, y, w, h) {
    new DarkPanel(this, x, y, w, h);
    const cx = x + w / 2;
    let cy = y + 50;

    this.add
      .text(cx, cy, "REGISTRAR", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    cy += 60;
    this.regUser = new TextInput(this, cx - 140, cy, 280, 50, "Usuário");
    cy += 65;
    this.regEmail = new TextInput(this, cx - 140, cy, 280, 50, "E-mail");
    cy += 65;
    this.regPass = new TextInput(this, cx - 140, cy, 280, 50, "Senha", true);

    // Navegação
    this.regUser.setNextInput(this.regEmail);
    this.regEmail.setNextInput(this.regPass);
    this.regPass.setNextInput(this.regUser);
    const triggerRegister = () => this.handleRegister();
    this.regUser.setOnEnter(triggerRegister);
    this.regEmail.setOnEnter(triggerRegister);
    this.regPass.setOnEnter(triggerRegister);

    cy += 90;
    this.btnRegister = new TextButton(
      this,
      cx,
      cy,
      "CRIAR CONTA",
      () => this.handleRegister(),
      280,
      55
    );
  }

  handleLogin() {
    const username = this.loginUser.getValue();
    const password = this.loginPass.getValue();
    if (!username || !password) {
      this.showError("Preencha usuário e senha.");
      return;
    }
    this.showError("");
    this.btnLogin.textObj.setText("ENTRANDO...");
    socketService.emit("auth:login", { username, password });
  }

  handleRegister() {
    const username = this.regUser.getValue();
    const email = this.regEmail.getValue();
    const password = this.regPass.getValue();
    if (!username || !email || !password) {
      this.showError("Preencha todos os campos.");
      return;
    }
    this.showError("");
    this.btnRegister.textObj.setText("CRIANDO...");
    socketService.emit("auth:register", { username, email, password });
  }

  setupSocketEvents() {
    // Sucesso no Login/Registro MANUAL
    socketService.on("auth:success", (data) => {
      console.log("Autenticado via Form:", data);
      this.registry.set("userId", data.id);
      this.registry.set("username", data.username);
      localStorage.setItem("userId", data.id);
      localStorage.setItem("username", data.username);

      if (data.activeMatchId) {
        this.registry.set("currentMatchId", data.activeMatchId);
        this.scene.start("GameScene");
      } else {
        this.scene.start("MenuScene");
      }
    });

    // Erro no Login/Registro
    socketService.on("error", (data) => {
      this.showError(data.message || "Erro de autenticação.");
      if (this.btnLogin) this.btnLogin.textObj.setText("ENTRAR");
      if (this.btnRegister) this.btnRegister.textObj.setText("CRIAR CONTA");

      // Se der erro no Auto-Login (ex: usuário deletado), limpa storage e mostra form
      if (this.loadingText && this.loadingText.active) {
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        this.scene.restart(); // Reinicia a cena para mostrar o form limpo
      }
    });
  }

  showError(msg) {
    // Se o texto de erro ainda não foi criado (auto-login falhou), não tenta usar
    if (!this.errorText) return;

    this.errorText.setText(msg);
    if (msg) {
      this.tweens.add({
        targets: this.errorText,
        x: this.errorText.x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  shutdown() {
    socketService.off("auth:success");
    socketService.off("error");
    socketService.off("auth:session_checked");
  }
}
