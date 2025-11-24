// client/src/scenes/EntryScene.js
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

    // --- Layout ---
    const panelW = 350;
    const panelH = 450;
    const gap = 40; // Espaço entre os painéis
    const startY = centerY - panelH / 2;

    // Painel Esquerdo (Login) fica à esquerda do centro
    const leftPanelX = centerX - panelW - gap / 2;

    // Painel Direito (Registro) fica à direita do centro
    const rightPanelX = centerX + gap / 2;

    // Feedback de Erro Geral (centralizado no topo)
    this.errorText = this.add
      .text(centerX, startY - 50, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ff5555",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // --- Título Principal ---
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

    // --- Bloco da Esquerda: LOGIN ---
    this.createLoginBlock(leftPanelX, startY, panelW, panelH);

    // --- Bloco da Direita: REGISTRO ---
    this.createRegisterBlock(rightPanelX, startY, panelW, panelH);

    // --- Socket Listeners ---
    this.setupSocketEvents();
  }

  createLoginBlock(x, y, w, h) {
    new DarkPanel(this, x, y, w, h);

    const centerX = x + w / 2;
    let currentY = y + 50;

    this.add
      .text(centerX, currentY, "LOGIN", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    currentY += 70;
    this.loginUser = new TextInput(
      this,
      centerX - 140,
      currentY,
      280,
      50,
      "Usuário"
    );

    currentY += 70;
    this.loginPass = new TextInput(
      this,
      centerX - 140,
      currentY,
      280,
      50,
      "Senha",
      true
    );

    currentY += 100;
    this.btnLogin = new TextButton(
      this,
      centerX,
      currentY,
      "ENTRAR",
      () => this.handleLogin(),
      280,
      55
    );

    // --- NOVO: Configurando Navegação (TAB e ENTER) ---
    // Tab no User vai para Senha
    this.loginUser.setNextInput(this.loginPass);

    // Tab na Senha volta para User (loop) ou vai pro botão (se ele fosse focável)
    this.loginPass.setNextInput(this.loginUser);

    // Enter em qualquer um tenta logar
    const triggerLogin = () => this.handleLogin();
    this.loginUser.setOnEnter(triggerLogin);
    this.loginPass.setOnEnter(triggerLogin);
  }

  createRegisterBlock(x, y, w, h) {
    new DarkPanel(this, x, y, w, h);

    const centerX = x + w / 2;
    let currentY = y + 50;

    this.add
      .text(centerX, currentY, "REGISTRAR", {
        fontFamily: "Arial",
        fontSize: "24px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    currentY += 60;
    this.regUser = new TextInput(
      this,
      centerX - 140,
      currentY,
      280,
      50,
      "Usuário"
    );

    currentY += 65;
    this.regEmail = new TextInput(
      this,
      centerX - 140,
      currentY,
      280,
      50,
      "E-mail"
    );

    currentY += 65;
    this.regPass = new TextInput(
      this,
      centerX - 140,
      currentY,
      280,
      50,
      "Senha",
      true
    );

    currentY += 90;
    this.btnRegister = new TextButton(
      this,
      centerX,
      currentY,
      "CRIAR CONTA",
      () => this.handleRegister(),
      280,
      55
    );

    // --- NOVO: Configurando Navegação (TAB e ENTER) ---
    this.regUser.setNextInput(this.regEmail);
    this.regEmail.setNextInput(this.regPass);
    this.regPass.setNextInput(this.regUser); // Loop

    const triggerRegister = () => this.handleRegister();
    this.regUser.setOnEnter(triggerRegister);
    this.regEmail.setOnEnter(triggerRegister);
    this.regPass.setOnEnter(triggerRegister);
  }

  handleLogin() {
    const username = this.loginUser.getValue();
    const password = this.loginPass.getValue();

    if (!username || !password) {
      this.showError("Preencha usuário e senha para entrar.");
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
      this.showError("Preencha todos os campos para registrar.");
      return;
    }
    this.showError("");
    this.btnRegister.textObj.setText("CRIANDO...");
    socketService.emit("auth:register", { username, email, password });
  }

  setupSocketEvents() {
    // Sucesso (Tanto faz se veio do Login ou Registro)
    socketService.on("auth:success", (data) => {
      console.log("Autenticado:", data);
      // Salva na sessão
      this.registry.set("userId", data.id);
      this.registry.set("username", data.username);

      localStorage.setItem("userId", data.id);
      localStorage.setItem("username", data.username);

      // VAI PARA O MENU
      this.scene.start("MenuScene");
    });

    // Erro
    socketService.on("error", (data) => {
      this.showError(data.message || "Erro de autenticação.");
      // Restaura textos dos botões
      this.btnLogin.textObj.setText("ENTRAR");
      this.btnRegister.textObj.setText("CRIAR CONTA");
    });
  }

  showError(msg) {
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
  }
}
