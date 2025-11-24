import Phaser from "phaser";
import HexBackground from "../modules/ui/HexBackground";
import CardSelector from "../modules/ui/CardSelector";
import TextInput from "../modules/ui/TextInput";
import TextButton from "../modules/ui/TextButton";
import CycleButton from "../modules/ui/CycleButton";
import socketService from "../services/SocketService";

export class KingdomCreationScene extends Phaser.Scene {
  constructor() {
    super({ key: "KingdomCreationScene" });
  }

  create() {
    new HexBackground(this).create();
    const { width, height } = this.scale;

    // Título Fixo
    this.mainTitle = this.add
      .text(width / 2, 50, "CRIAÇÃO DE REINO", {
        font: "32px Arial",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Estado acumulado da criação
    this.creationData = {
      race: null,
      alignment: null,
      name: "",
      capitalName: "",
    };

    // Container que será limpo a cada passo
    this.stepContainer = this.add.container(0, 0);

    // Variáveis de controle de Socket para limpeza
    this.currentSocketEvent = null;
    this.currentSocketCallback = null;

    // Inicia o Wizard
    this.startStep1_RaceSelection();
  }

  // ==========================================================
  // PASSO 1: RAÇA
  // ==========================================================
  startStep1_RaceSelection() {
    this.clearStep();
    const { width, height } = this.scale;

    const subTitle = this.add
      .text(width / 2, 110, "PASSO 1/3: Escolha sua Linhagem", {
        fontSize: "24px",
        color: "#aaa",
      })
      .setOrigin(0.5);
    this.stepContainer.add(subTitle);

    const cardSelector = new CardSelector(this, width / 2, height / 2 + 40);
    this.stepContainer.add(cardSelector);

    // Callback de seleção
    cardSelector.setOnSelect((selectedData) => {
      this.creationData.race = selectedData.id;
      console.log("Raça salva:", selectedData.id);
      this.startStep2_Alignment(); // Vai para o Passo 2
    });

    // Socket: Pede e recebe dados das raças
    const onData = (data) => cardSelector.setRaces(data);
    socketService.on("kingdom:races_data", onData);
    socketService.emit("kingdom:get_races");

    this.currentSocketEvent = "kingdom:races_data";
    this.currentSocketCallback = onData;
  }

  // ==========================================================
  // PASSO 2: ALINHAMENTO
  // ==========================================================
  startStep2_Alignment() {
    this.clearStep();
    const { width, height } = this.scale;

    const subTitle = this.add
      .text(width / 2, 110, "PASSO 2/3: Defina sua Moralidade", {
        fontSize: "24px",
        color: "#aaa",
      })
      .setOrigin(0.5);
    this.stepContainer.add(subTitle);

    const cardSelector = new CardSelector(this, width / 2, height / 2 + 40);
    this.stepContainer.add(cardSelector);

    // Callback de seleção
    cardSelector.setOnSelect((selectedData) => {
      this.creationData.alignment = selectedData.id;
      console.log("Alinhamento salvo:", selectedData.id);
      this.startStep3_Finalize(); // CORREÇÃO: Chama o método com o nome correto
    });

    // Socket: Pede e recebe dados de alinhamento
    const onData = (data) => cardSelector.setRaces(data);
    socketService.on("kingdom:alignments_data", onData);
    socketService.emit("kingdom:get_alignments");

    this.currentSocketEvent = "kingdom:alignments_data";
    this.currentSocketCallback = onData;
  }

  // ==========================================================
  // PASSO 3: FINALIZAÇÃO E DADOS ESPECÍFICOS
  // ==========================================================
  startStep3_Finalize() {
    this.clearStep();
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const subTitle = this.add
      .text(cx, 80, "PASSO 3/3: Detalhes Finais", {
        fontSize: "24px",
        color: "#aaa",
      })
      .setOrigin(0.5);
    this.stepContainer.add(subTitle);

    // Inicializa variáveis de controle
    this.elementalChoices = [];
    this.insectChoice = null;

    // Define a largura dos inputs para ficar padronizado
    const inputW = 400;
    const inputH = 45;

    // Ponto X inicial para Inputs (Centralizado: Centro da tela - Metade da largura do input)
    const inputX = cx - inputW / 2;

    let currentY = 140;

    // 1. RENDERIZAÇÃO CONDICIONAL
    const raceId = this.creationData.race;

    if (raceId === "ELEMENTAL") {
      this.createElementalSelector(cx, currentY);
      currentY += 100;
    } else if (raceId === "INSETO") {
      this.createInsectSelector(cx, currentY);
      currentY += 80;
    }

    // 2. CAMPOS DE TEXTO - IDENTIDADE
    this.add
      .text(cx, currentY, "IDENTIDADE", {
        fontSize: "14px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    currentY += 25;
    this.inpName = new TextInput(
      this,
      inputX,
      currentY,
      inputW,
      inputH,
      "Nome do Reino"
    );
    this.stepContainer.add(this.inpName);

    currentY += 55; // Espaço entre inputs
    this.inpCapital = new TextInput(
      this,
      inputX,
      currentY,
      inputW,
      inputH,
      "Nome da Capital"
    );
    this.stepContainer.add(this.inpCapital);

    // 3. CAMPOS DE TEXTO - VISUAL
    currentY += 80; // Espaço maior entre seções
    this.add
      .text(cx, currentY, "HERÁLDICA (Opcional)", {
        fontSize: "14px",
        color: "#ffd700",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    currentY += 25;
    this.inpCrest = new TextInput(
      this,
      inputX,
      currentY,
      inputW,
      inputH,
      "URL do Brasão (Ex: imgur.com/...)"
    );
    this.stepContainer.add(this.inpCrest);

    currentY += 55;
    this.inpCapitalImg = new TextInput(
      this,
      inputX,
      currentY,
      inputW,
      inputH,
      "URL da Capital"
    );
    this.stepContainer.add(this.inpCapitalImg);

    // 4. BOTÃO FINAL
    // Botão usa pivot central, então usa 'cx' direto
    const btnCreate = new TextButton(
      this,
      cx,
      height - 80,
      "FUNDAR REINO",
      () => {
        this.validateAndSubmit();
      },
      300,
      60
    );
    this.stepContainer.add(btnCreate);
  }

  // --- UI Auxiliar: Elementais ---
  createElementalSelector(x, y) {
    const txt = this.add
      .text(x, y, "Escolha 2 Elementos para sua Dualidade:", {
        fontSize: "18px",
        color: "#aaddff",
      })
      .setOrigin(0.5);
    this.stepContainer.add(txt);

    const elements = ["FOGO", "GELO", "RAIO"];
    let btnX = x - 100;

    elements.forEach((el) => {
      const btn = new TextButton(this, btnX, y + 40, el, null, 90, 40);

      // Sobrescreve clique para virar toggle
      btn.removeAllListeners("pointerdown");
      btn.on("pointerdown", () => {
        const index = this.elementalChoices.indexOf(el);

        if (index > -1) {
          // Remover
          this.elementalChoices.splice(index, 1);
          btn.textObj.setColor("#eeeeee");
          btn.updateVisuals(0x222222, 0x444444);
        } else {
          // Adicionar (se < 2)
          if (this.elementalChoices.length < 2) {
            this.elementalChoices.push(el);
            btn.textObj.setColor("#ffffff");
            btn.updateVisuals(0x004488, 0x00aaff);
          }
        }
      });

      this.stepContainer.add(btn);
      btnX += 100;
    });
  }

  // --- UI Auxiliar: Insetos ---
  createInsectSelector(x, y) {
    const txt = this.add
      .text(x, y, "Escolha seu Recurso de Colmeia:", {
        fontSize: "18px",
        color: "#aaffaa",
      })
      .setOrigin(0.5);
    this.stepContainer.add(txt);

    const resources = ["MINERIO", "COMIDA", "ARCANA", "EXPERIENCIA", "DEVOCAO"];
    this.insectChoice = new CycleButton(this, x, y + 40, "Bônus", resources);
    this.stepContainer.add(this.insectChoice);
  }

  // ==========================================================
  // VALIDAÇÃO E ENVIO
  // ==========================================================
  validateAndSubmit() {
    // 1. SEGURANÇA PRIMEIRO: Verifica se o usuário existe antes de fazer qualquer coisa
    const userId = this.registry.get("userId");

    if (!userId) {
      console.error("Erro Crítico: UserID não encontrado na sessão.");
      alert("Sessão expirada. Por favor, faça login novamente.");
      this.scene.start("EntryScene");
      return;
    }

    // 2. Coleta os dados do formulário
    const name = this.inpName.getValue();
    const capitalName = this.inpCapital.getValue();
    const crestUrl = this.inpCrest.getValue();
    const capitalImageUrl = this.inpCapitalImg.getValue();

    // 3. Validação Básica de Inputs
    if (!name || !capitalName) {
      alert("Seu reino precisa de um Nome e uma Capital!");
      return;
    }

    // 4. Validação e Construção do Metadata (Lógica das Raças)
    let metadataString = "[]";

    if (this.creationData.race === "ELEMENTAL") {
      if (this.elementalChoices.length !== 2) {
        alert("Reinos Elementais DEVEM escolher exatamente 2 elementos.");
        return;
      }
      metadataString = JSON.stringify(this.elementalChoices);
    } else if (this.creationData.race === "INSETO") {
      // CycleButton sempre tem valor, mas garantimos
      const choice = this.insectChoice.getValue();
      metadataString = choice;
    }

    // 5. Monta o Payload Final
    const payload = {
      userId: userId, // Agora a variável userId existe e é válida
      name,
      capitalName,
      crestUrl,
      capitalImageUrl,
      alignment: this.creationData.alignment,
      race: this.creationData.race,
      raceMetadata: metadataString,
    };

    console.log("Enviando payload de criação:", payload);

    // 6. Feedback Visual (Muda o texto do botão)
    // Localiza o botão dentro do container para mudar o texto
    const btn = this.stepContainer.list.find(
      (c) => c instanceof TextButton && c.textString === "FUNDAR REINO"
    );

    if (btn) {
      btn.textObj.setText("CONSULTANDO O ORÁCULO...");
      // Opcional: Desativar interatividade para evitar clique duplo
      btn.disableInteractive();
    }

    // 7. Configura os Listeners do Socket
    // Importante: Remover listeners anteriores para evitar duplicidade se der erro e tentar de novo
    socketService.off("kingdom:created");
    socketService.off("error");

    socketService.on("kingdom:created", (kingdom) => {
      console.log("Sucesso! Reino criado:", kingdom);
      this.scene.start("KingdomsScene");
    });

    socketService.on("error", (err) => {
      console.error("Erro do servidor:", err);
      alert("Erro ao criar: " + err.message);

      // Restaura o botão se der erro
      if (btn) {
        btn.textObj.setText("FUNDAR REINO");
        btn.setInteractive();
      }
    });

    // 8. Dispara o evento
    socketService.emit("kingdom:create", payload);
  }

  // ==========================================================
  // LIMPEZA
  // ==========================================================
  clearStep() {
    // Limpa visuais (inputs, botões, textos) do passo anterior
    this.stepContainer.removeAll(true);

    // Limpa listeners de socket do passo anterior para evitar duplicação
    if (this.currentSocketEvent && this.currentSocketCallback) {
      socketService.off(this.currentSocketEvent, this.currentSocketCallback);
      this.currentSocketEvent = null;
      this.currentSocketCallback = null;
    }
  }
}
