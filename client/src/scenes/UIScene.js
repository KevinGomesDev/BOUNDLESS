import Phaser from "phaser";
import { TopBar } from "../modules/components/TopBar"; // Verifique se o caminho está correto

export class UIScene extends Phaser.Scene {
  constructor() {
    // active: true garante que ela rode em paralelo com a GameScene
    super({ key: "UIScene", active: true });
    this.topBar = null;
  }

  create() {
    this.topBar = new TopBar(this);
  }

  // --- MÉTODOS CHAMADOS PELA GAMESCENE ---

  // Renomeado de updateInfo para updateTerritoryInfo para bater com a chamada da GameScene
  updateTerritoryInfo(data) {
    if (this.topBar) {
      this.topBar.updateTerritoryInfo(data);
    }
  }

  // Adicionado: Para atualizar Ouro/Mana
  updateResource(key, value) {
    if (this.topBar) {
      this.topBar.updateResource(key, value);
    }
  }

  // Adicionado: Para esconder a UI quando um Modal abre
  setModalState(isOpen) {
    if (this.topBar) {
      if (isOpen) {
        this.topBar.hideTooltip();
      }
    }
  }

  setCombatMode(isActive, data) {
    if (this.topBar) {
      if (isActive && data) {
        const terrainName = data.terrainName || "Desconhecido";
        this.topBar.setCombatState(true, terrainName, 0xff4444);
      } else {
        this.topBar.setCombatState(false);
      }
    }
  }
}
