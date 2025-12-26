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

    // Detecta qual cena está ativa e atualiza a aba correspondente
    this.events.on("wake", () => {
      this.updateActiveTab();
    });
  }

  updateActiveTab() {
    // Pega a cena ativa que não seja a UIScene
    const scenes = this.scene.manager.scenes;
    for (const scene of scenes) {
      if (scene.scene.isActive() && scene.scene.key !== "UIScene") {
        const tabMap = {
          GameScene: "worldmap",
          TerritoryScene: "territory",
          BattleScene: "battle",
          KingdomScene: "kingdom",
        };
        const tabId = tabMap[scene.scene.key];
        if (tabId && this.topBar) {
          this.topBar.setActiveTab(tabId);
        }
        break;
      }
    }
  }

  // --- MÉTODOS CHAMADOS PELA GAMESCENE ---

  // Mantido por compatibilidade, direciona para HOVER
  updateTerritoryInfo(data) {
    if (this.topBar) {
      this.topBar.updateHoveredInfo(data);
    }
  }

  updateHoveredTerritoryInfo(data) {
    if (this.topBar) {
      this.topBar.updateHoveredInfo(data);
    }
  }

  updateSelectedTerritoryInfo(data) {
    if (this.topBar) {
      this.topBar.updateSelectedInfo(data);
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

  setTabEnabled(tabId, enabled) {
    if (this.topBar) {
      this.topBar.setTabEnabled(tabId, enabled);
    }
  }

  setActiveTab(tabId) {
    if (this.topBar) {
      this.topBar.setActiveTab(tabId);
    }
  }
}
