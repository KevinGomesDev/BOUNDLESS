import Phaser from "phaser";
import { TopBar } from "../modules/components/TopBar";
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
    this.topBar = null;
  }

  create() {
    // Instancia a barra unificada
    this.topBar = new TopBar(this);
  }

  // Método chamado pela GameScene quando o jogador clica/seleciona algo
  updateInfo(data) {
    if (this.topBar) {
      this.topBar.updateTerritoryInfo(data);
    }
  }

  // (Opcional) Se você tiver lógica de atualizar recursos no futuro
  updateResources(resourceData) {
    if (this.topBar) {
      // Exemplo: resourceData = { gold: 1050, wood: 400 }
      Object.keys(resourceData).forEach((key) => {
        this.topBar.updateResource(key, resourceData[key]);
      });
    }
  }

  // Removemos setModalState pois não há mais botão de fechar para esconder
}
