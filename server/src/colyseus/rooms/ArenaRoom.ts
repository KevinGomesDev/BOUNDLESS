// server/src/colyseus/rooms/ArenaRoom.ts
// Room principal para Arena (Lobby + Battle)

import { Room, Client, Delayed } from "@colyseus/core";
import { prisma } from "../../lib/prisma";
import {
  ArenaBattleState,
  BattlePlayerSchema,
  BattleUnitSchema,
  BattleObstacleSchema,
  ArenaConfigSchema,
  BattleMapConfigSchema,
} from "../schemas";
import { createBattleUnitsForArena } from "../../utils/battle-unit.factory";
import {
  TURN_CONFIG,
  GRID_CONFIG,
  getGridDimensions,
  getRandomTerrain,
  getRandomArenaSize,
  getObstacleCount,
  getRandomObstacleType,
  getMaxMarksByCategory,
  HP_CONFIG,
  MANA_CONFIG,
  type ObstacleType,
} from "../../../../shared/config/global.config";
import type { BattleUnit } from "../../../../shared/types/battle.types";
import {
  saveArenaBattle,
  loadBattle,
  deleteBattle,
  markBattleEnded,
  type PersistedBattleState,
} from "../../services/battle-persistence.service";
import { QTEManager } from "../../qte";
import type { QTEConfig, QTEResponse, QTEResult } from "../../../../shared/qte";
import type { CommandPayload } from "../../../../shared/types/commands.types";
import { handleCommand, parseCommandArgs } from "../../commands";
import { findCommandByCode } from "../../../../shared/data/Templates/CommandsTemplates";
import { getExtraAttacksFromConditions } from "../../logic/conditions";
import { applyDamage } from "../../utils/damage.utils";

// Cores dos jogadores (até 8)
const PLAYER_COLORS = [
  "#e63946",
  "#457b9d",
  "#2a9d8f",
  "#f4a261",
  "#9b59b6",
  "#1abc9c",
  "#e74c3c",
  "#3498db",
];

interface ArenaRoomOptions {
  userId: string;
  kingdomId: string;
  maxPlayers?: number;
  vsBot?: boolean;
  restoreBattleId?: string; // ID da batalha para restaurar do banco
}

interface JoinOptions {
  userId: string;
  kingdomId: string;
}

export class ArenaRoom extends Room<ArenaBattleState> {
  maxClients = 8;

  private turnTimer: Delayed | null = null;
  private lobbyPhase: boolean = true;
  private readyPlayers = new Set<string>();
  private disconnectedPlayers = new Map<
    string,
    { timeout: Delayed; data: any }
  >();
  private persistenceTimer: Delayed | null = null;
  private allDisconnectedSince: number | null = null;
  private rematchRequests = new Set<string>();
  private restoredFromDb = false;

  /** Gerenciador de QTEs ativos */
  private qteManager: QTEManager | null = null;

  async onCreate(options: ArenaRoomOptions) {
    this.autoDispose = true;
    console.log(`[ArenaRoom] Criando sala: ${this.roomId}`);
    console.log(
      `[ArenaRoom] Options recebidas:`,
      JSON.stringify(options, null, 2)
    );

    // Verificar se é uma restauração de batalha do banco
    if (options.restoreBattleId) {
      const restored = await this.restoreFromDatabase(options.restoreBattleId);
      if (restored) {
        console.log(
          `[ArenaRoom] Batalha ${options.restoreBattleId} restaurada do banco`
        );
        this.restoredFromDb = true;
        this.lobbyPhase = false;
        // Registrar handlers e sair
        this.registerMessageHandlers();
        return;
      }
      console.warn(
        `[ArenaRoom] Falha ao restaurar batalha ${options.restoreBattleId}, criando nova`
      );
    }

    // Inicializar estado
    this.setState(new ArenaBattleState());
    this.state.battleId = this.roomId;
    this.state.lobbyId = this.roomId;
    this.state.status = "WAITING";
    this.state.maxPlayers = Math.min(8, Math.max(2, options.maxPlayers || 2));

    // Configurar metadata para listagem
    this.setMetadata({
      hostUserId: options.userId,
      maxPlayers: this.state.maxPlayers,
      playerCount: 0,
      players: [] as string[],
      playerKingdoms: {} as Record<string, string>, // userId -> kingdomId
      vsBot: options.vsBot || false,
      status: "WAITING",
    });

    // Registrar handlers de mensagens
    this.registerMessageHandlers();

    // Se é contra BOT, marcar flag
    if (options.vsBot) {
      this.metadata.vsBot = true;
    }
  }

  /**
   * Restaura uma batalha do banco de dados
   */
  private async restoreFromDatabase(battleId: string): Promise<boolean> {
    try {
      const persistedBattle = await loadBattle(battleId);
      if (!persistedBattle) {
        return false;
      }

      // Inicializar estado
      this.setState(new ArenaBattleState());
      this.state.battleId = battleId;
      this.state.lobbyId = persistedBattle.lobbyId || battleId;
      this.state.status = "ACTIVE";
      this.state.round = persistedBattle.round;
      this.state.gridWidth = persistedBattle.gridWidth;
      this.state.gridHeight = persistedBattle.gridHeight;
      this.state.maxPlayers = persistedBattle.maxPlayers;
      this.state.currentTurnIndex = persistedBattle.currentTurnIndex;

      // Restaurar actionOrder
      persistedBattle.actionOrder.forEach((id) => {
        this.state.actionOrder.push(id);
      });

      // Restaurar config
      if (!this.state.config) {
        this.state.config = new ArenaConfigSchema();
      }
      if (!this.state.config.map) {
        this.state.config.map = new BattleMapConfigSchema();
      }
      this.state.config.map.terrainType = persistedBattle.terrainType;

      // Restaurar obstáculos (ArenaBattleState.obstacles é ArraySchema)
      for (const obs of persistedBattle.obstacles) {
        const obstacle = new BattleObstacleSchema();
        obstacle.id = obs.id;
        obstacle.posX = obs.posX;
        obstacle.posY = obs.posY;
        obstacle.type = obs.type;
        obstacle.hp = obs.hp;
        obstacle.maxHp = obs.maxHp;
        obstacle.destroyed = obs.destroyed ?? false;
        this.state.obstacles.push(obstacle);
      }

      // Restaurar jogadores
      for (let i = 0; i < persistedBattle.playerIds.length; i++) {
        const player = new BattlePlayerSchema();
        player.oderId = persistedBattle.playerIds[i];
        player.kingdomId = persistedBattle.kingdomIds[i] || "";
        player.playerIndex = i;
        player.playerColor =
          persistedBattle.playerColors[i] || PLAYER_COLORS[i];
        player.isConnected = false; // Será true quando reconectar
        player.isBot = player.oderId.startsWith("bot_");

        // Buscar nome do reino
        const kingdom = await prisma.kingdom.findUnique({
          where: { id: player.kingdomId },
          include: { owner: true },
        });
        player.kingdomName = kingdom?.name || "Reino";
        player.username = kingdom?.owner?.username || "Player";

        this.state.players.push(player);
      }

      // Restaurar unidades
      for (const unit of persistedBattle.units) {
        const battleUnit = new BattleUnitSchema();
        battleUnit.id = unit.id;
        battleUnit.sourceUnitId = unit.sourceUnitId || "";
        battleUnit.ownerId = unit.ownerId || "";
        battleUnit.ownerKingdomId = unit.ownerKingdomId || "";
        battleUnit.name = unit.name;
        battleUnit.avatar = unit.avatar || "";
        battleUnit.category = unit.category;
        battleUnit.troopSlot = unit.troopSlot ?? -1;
        battleUnit.level = unit.level;
        battleUnit.race = unit.race || "";
        battleUnit.classCode = unit.classCode || "";
        battleUnit.combat = unit.combat;
        battleUnit.speed = unit.speed;
        battleUnit.focus = unit.focus;
        battleUnit.resistance = unit.resistance;
        battleUnit.will = unit.will;
        battleUnit.vitality = unit.vitality;
        battleUnit.damageReduction = unit.damageReduction;
        battleUnit.maxHp = unit.maxHp;
        battleUnit.currentHp = unit.currentHp;
        battleUnit.maxMana = unit.maxMana;
        battleUnit.currentMana = unit.currentMana;
        battleUnit.posX = unit.posX;
        battleUnit.posY = unit.posY;
        battleUnit.movesLeft = unit.movesLeft;
        battleUnit.actionsLeft = unit.actionsLeft;
        battleUnit.attacksLeftThisTurn = unit.attacksLeftThisTurn;
        battleUnit.isAlive = unit.isAlive;
        battleUnit.actionMarks = unit.actionMarks;
        battleUnit.physicalProtection = unit.physicalProtection;
        battleUnit.maxPhysicalProtection = unit.maxPhysicalProtection;
        battleUnit.magicalProtection = unit.magicalProtection;
        battleUnit.maxMagicalProtection = unit.maxMagicalProtection;
        battleUnit.hasStartedAction = unit.hasStartedAction;
        battleUnit.grabbedByUnitId = unit.grabbedByUnitId || "";
        battleUnit.isAIControlled = unit.isAIControlled;
        battleUnit.aiBehavior = unit.aiBehavior || "AGGRESSIVE";
        battleUnit.size = unit.size;
        battleUnit.visionRange = unit.visionRange;

        // Restaurar arrays
        unit.features.forEach((f) => battleUnit.features.push(f));
        unit.equipment.forEach((e) => battleUnit.equipment.push(e));
        unit.spells.forEach((s) => battleUnit.spells.push(s));
        unit.conditions.forEach((c) => battleUnit.conditions.push(c));

        // Restaurar cooldowns
        Object.entries(unit.unitCooldowns).forEach(([key, value]) => {
          battleUnit.unitCooldowns.set(key, value);
        });

        this.state.units.set(battleUnit.id, battleUnit);
      }

      // Atualizar metadata
      this.setMetadata({
        hostUserId: persistedBattle.playerIds[0],
        maxPlayers: persistedBattle.maxPlayers,
        playerCount: persistedBattle.playerIds.length,
        players: persistedBattle.playerIds,
        vsBot: persistedBattle.playerIds.some((id) => id.startsWith("bot_")),
        status: "BATTLING",
      });

      // Deletar do banco (já está na memória agora)
      await deleteBattle(battleId);

      console.log(
        `[ArenaRoom] Restauração completa: ${persistedBattle.units.length} unidades, ${persistedBattle.obstacles.length} obstáculos`
      );

      return true;
    } catch (error) {
      console.error(`[ArenaRoom] Erro ao restaurar batalha:`, error);
      return false;
    }
  }

  async onJoin(client: Client, options: JoinOptions) {
    console.log(
      `[ArenaRoom] ${client.sessionId} entrou na sala ${this.roomId}`
    );

    const { userId, kingdomId } = options;

    // Verificar se ainda está em fase de lobby
    if (!this.lobbyPhase && this.state.status !== "WAITING") {
      // Tentar reconectar jogador desconectado (via disconnectedPlayers map)
      const disconnected = this.disconnectedPlayers.get(userId);
      if (disconnected) {
        disconnected.timeout.clear();
        this.disconnectedPlayers.delete(userId);

        // Atualizar player como conectado
        const player = this.state.getPlayer(userId);
        if (player) {
          player.isConnected = true;
          client.userData = { userId, kingdomId };
        }

        // Cancelar persistência pendente
        this.cancelPersistence();

        console.log(
          `[ArenaRoom] Jogador ${userId} reconectado via disconnectedPlayers`
        );
        client.send("battle:reconnected", { success: true });
        return;
      }

      // Tentar reconectar jogador que já existe no state (refresh de página)
      const existingPlayer = this.state.getPlayer(userId);
      if (existingPlayer) {
        existingPlayer.isConnected = true;
        client.userData = { userId, kingdomId };

        // Cancelar persistência pendente
        this.cancelPersistence();

        console.log(
          `[ArenaRoom] Jogador ${userId} reconectado (já existe no state)`
        );
        client.send("battle:reconnected", { success: true });
        return;
      }

      throw new Error("Batalha já iniciada");
    }

    // Verificar se já está no lobby (em fase de lobby, pode reconectar também)
    const existingPlayer = this.state.getPlayer(userId);
    if (existingPlayer) {
      // Se já existe, apenas reconectar
      existingPlayer.isConnected = true;
      client.userData = { userId, kingdomId };

      console.log(`[ArenaRoom] Jogador ${userId} reconectado ao lobby`);
      client.send("lobby:reconnected", {
        lobbyId: this.roomId,
        playerIndex: existingPlayer.playerIndex,
        players: this.getPlayersInfo(),
      });
      return;
    }

    // Verificar limite de jogadores
    if (this.state.players.length >= this.state.maxPlayers) {
      throw new Error("Lobby cheio");
    }

    // Buscar dados do reino
    const kingdom = await prisma.kingdom.findUnique({
      where: { id: kingdomId },
      include: { regent: true, owner: true },
    });

    if (!kingdom) {
      throw new Error("Reino não encontrado");
    }

    if (kingdom.ownerId !== userId) {
      throw new Error("Este reino não pertence a você");
    }

    if (!kingdom.regent) {
      throw new Error("Reino sem Regente definido");
    }

    // Criar jogador
    const playerIndex = this.state.players.length;
    const player = new BattlePlayerSchema();
    player.oderId = userId;
    player.kingdomId = kingdomId;
    player.kingdomName = kingdom.name;
    player.username = kingdom.owner?.username || "Unknown";
    player.playerIndex = playerIndex;
    player.playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
    player.isConnected = true;
    player.isBot = false;

    this.state.players.push(player);

    // Atualizar metadata com mapeamento de kingdomIds
    const playerKingdoms: Record<string, string> = {};
    this.state.players.forEach((p: BattlePlayerSchema) => {
      playerKingdoms[p.oderId] = p.kingdomId;
    });

    this.setMetadata({
      ...this.metadata,
      playerCount: this.state.players.length,
      players: this.state.players.map((p: BattlePlayerSchema) => p.oderId),
      playerKingdoms,
      status:
        this.state.players.length >= this.state.maxPlayers
          ? "READY"
          : "WAITING",
    });

    // Associar client ao userId
    client.userData = { userId, kingdomId };

    // Notificar o cliente que entrou
    client.send("lobby:joined", {
      lobbyId: this.roomId,
      playerIndex,
      players: this.getPlayersInfo(),
    });

    // Broadcast para outros jogadores
    this.broadcast(
      "lobby:player_joined",
      {
        player: {
          oderId: userId,
          username: player.username,
          kingdomName: player.kingdomName,
          playerIndex,
        },
        totalPlayers: this.state.players.length,
        maxPlayers: this.state.maxPlayers,
      },
      { except: client }
    );

    // Se vsBot, adicionar bot e iniciar batalha
    console.log(
      `[ArenaRoom] vsBot check: vsBot=${this.metadata.vsBot}, players=${this.state.players.length}`
    );
    if (this.metadata.vsBot && this.state.players.length === 1) {
      console.log(`[ArenaRoom] Iniciando fluxo vsBot...`);
      await this.addBotPlayer();
      console.log(
        `[ArenaRoom] Bot adicionado, players agora: ${this.state.players.length}`
      );
      await this.startBattle();
      console.log(
        `[ArenaRoom] startBattle() concluído, status: ${this.state.status}`
      );
      return; // Sair aqui - batalha já iniciou
    }

    // Se lobby cheio, pode iniciar (apenas se ainda não estiver em batalha)
    if (
      this.state.players.length >= this.state.maxPlayers &&
      this.state.status === "WAITING"
    ) {
      this.state.status = "READY";
    }
  }

  async onLeave(client: Client, consented: boolean) {
    const userData = client.userData as
      | { userId: string; kingdomId: string }
      | undefined;
    if (!userData) return;

    const { userId } = userData;
    console.log(`[ArenaRoom] ${userId} saiu da sala (consented: ${consented})`);

    // Se ainda em fase de lobby
    if (this.lobbyPhase) {
      // Remover jogador do lobby
      const playerIndex = this.state.players.findIndex(
        (p: BattlePlayerSchema) => p.oderId === userId
      );
      if (playerIndex !== -1) {
        this.state.players.splice(playerIndex, 1);

        // Reindexar jogadores restantes
        this.state.players.forEach((p: BattlePlayerSchema, idx: number) => {
          p.playerIndex = idx;
          p.playerColor = PLAYER_COLORS[idx % PLAYER_COLORS.length];
        });

        this.setMetadata({
          ...this.metadata,
          playerCount: this.state.players.length,
          players: this.state.players.map((p: BattlePlayerSchema) => p.oderId),
          status: "WAITING",
        });

        this.broadcast("lobby:player_left", { userId });
      }
      return;
    }

    // Se a batalha já terminou, não precisa fazer mais nada
    if (this.state.status === "ENDED" || this.state.winnerId) {
      console.log(
        `[ArenaRoom] ${userId} saiu após fim da batalha - ignorando surrender`
      );
      return;
    }

    // Em batalha - marcar como desconectado
    const player = this.state.getPlayer(userId);
    if (player) {
      player.isConnected = false;

      // Se não foi intencional, dar tempo para reconectar
      if (!consented) {
        try {
          await this.allowReconnection(client, 60); // 60 segundos para reconectar
          player.isConnected = true;
        } catch {
          // Jogador não reconectou - surrender automático
          this.handleSurrender(userId);
        }
      } else {
        // Saída intencional = surrender
        this.handleSurrender(userId);
      }
    }

    // Verificar se todos os jogadores humanos desconectaram
    this.checkAllDisconnected();
  }

  /**
   * Verifica se todos os jogadores humanos estão desconectados
   * Se sim, persiste a batalha no banco de dados
   */
  private checkAllDisconnected() {
    if (!this.lobbyPhase && this.state.status === "ACTIVE") {
      const humanPlayers = this.state.players.filter(
        (p: BattlePlayerSchema) => !p.isBot
      );
      const allDisconnected = humanPlayers.every(
        (p: BattlePlayerSchema) => !p.isConnected
      );

      if (allDisconnected && humanPlayers.length > 0) {
        this.allDisconnectedSince = Date.now();
        console.log(
          `[ArenaRoom] Todos os jogadores desconectaram. Persistindo batalha em 10s...`
        );

        // Aguardar 10 segundos antes de persistir (para permitir reconexão rápida)
        this.persistenceTimer = this.clock.setTimeout(async () => {
          await this.persistBattleToDb();
        }, 10000);
      }
    }
  }

  /**
   * Cancela a persistência se algum jogador reconectar
   */
  private cancelPersistence() {
    if (this.persistenceTimer) {
      this.persistenceTimer.clear();
      this.persistenceTimer = null;
      this.allDisconnectedSince = null;
      console.log(`[ArenaRoom] Persistência cancelada - jogador reconectou`);
    }
  }

  /**
   * Persiste a batalha no banco de dados
   */
  private async persistBattleToDb() {
    if (this.state.status !== "ACTIVE") {
      console.log(`[ArenaRoom] Não persistindo - batalha não está ativa`);
      return;
    }

    try {
      const playerIds = this.state.players.map(
        (p: BattlePlayerSchema) => p.oderId
      );
      const kingdomIds = this.state.players.map(
        (p: BattlePlayerSchema) => p.kingdomId
      );
      const playerColors = this.state.players.map(
        (p: BattlePlayerSchema) => p.playerColor
      );

      await saveArenaBattle(
        this.roomId,
        this.state,
        playerIds,
        kingdomIds,
        playerColors
      );

      console.log(
        `[ArenaRoom] Batalha ${this.roomId} persistida no banco de dados`
      );
    } catch (error) {
      console.error(`[ArenaRoom] Erro ao persistir batalha:`, error);
    }
  }

  async onDispose() {
    console.log(`[ArenaRoom] Sala ${this.roomId} sendo destruída`);

    // Limpar timers
    if (this.turnTimer) {
      this.turnTimer.clear();
      this.turnTimer = null;
    }

    if (this.persistenceTimer) {
      this.persistenceTimer.clear();
      this.persistenceTimer = null;
    }

    // Se a batalha estava ativa e não terminada, persistir no banco
    if (
      !this.lobbyPhase &&
      this.state.status === "ACTIVE" &&
      !this.state.winnerId
    ) {
      console.log(
        `[ArenaRoom] Batalha ativa não finalizada. Persistindo antes de destruir...`
      );
      await this.persistBattleToDb();
    }
  }

  // =========================================
  // Message Handlers
  // =========================================

  private registerMessageHandlers() {
    // Lobby handlers
    this.onMessage("lobby:ready", (client, _message) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) return;

      this.readyPlayers.add(userData.userId);
      this.broadcast("lobby:player_ready", { userId: userData.userId });

      // Verificar se todos estão prontos
      if (this.readyPlayers.size >= this.state.players.length) {
        this.startBattle();
      }
    });

    this.onMessage("lobby:start", async (client, _message) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) return;

      // Apenas host pode iniciar
      if (this.state.players[0]?.oderId !== userData.userId) {
        client.send("error", { message: "Apenas o host pode iniciar" });
        return;
      }

      if (this.state.players.length < 2) {
        client.send("error", { message: "Mínimo de 2 jogadores" });
        return;
      }

      await this.startBattle();
    });

    // Battle handlers
    this.onMessage("battle:begin_action", (client, { unitId }) => {
      this.handleBeginAction(client, unitId);
    });

    this.onMessage("battle:move", (client, { unitId, toX, toY }) => {
      this.handleMove(client, unitId, toX, toY);
    });

    this.onMessage(
      "battle:attack",
      (client, { attackerId, targetId, targetObstacleId, targetPosition }) => {
        this.handleAttack(
          client,
          attackerId,
          targetId,
          targetObstacleId,
          targetPosition
        );
      }
    );

    this.onMessage("battle:end_action", (client, { unitId }) => {
      this.handleEndAction(client, unitId);
    });

    this.onMessage(
      "battle:execute_action",
      (client, { actionName, unitId, params }) => {
        this.handleExecuteAction(client, actionName, unitId, params);
      }
    );

    this.onMessage(
      "battle:cast_spell",
      (client, { unitId, spellCode, targetId, targetPosition }) => {
        this.handleCastSpell(
          client,
          unitId,
          spellCode,
          targetId,
          targetPosition
        );
      }
    );

    // Handler para respostas de QTE
    this.onMessage("qte:response", (client, response: QTEResponse) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) return;
      this.handleQTEResponse(client, response);
    });

    this.onMessage("battle:surrender", (client, _message) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) return;
      this.handleSurrender(userData.userId);
    });

    this.onMessage("battle:request_rematch", (client, _message) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) return;
      this.handleRematchRequest(userData.userId);
    });

    // Event subscription handlers (para UI de logs)
    this.onMessage(
      "event:subscribe",
      (
        client,
        { context, contextId }: { context: string; contextId: string }
      ) => {
        // Por enquanto, apenas confirmar a inscrição
        // Os logs são enviados via state.logs
        client.send("event:subscribed", {
          context,
          contextId,
          events: Array.from(this.state.logs || []),
        });
      }
    );

    this.onMessage("event:unsubscribe", (_client, _message) => {
      // Nada a fazer - os logs são sincronizados via state
    });

    // Command handler para comandos de chat de batalha
    this.onMessage("battle:command", (client, payload: CommandPayload) => {
      const userData = client.userData as { userId: string } | undefined;
      if (!userData) {
        client.send("battle:command:response", {
          commandCode: payload.commandCode,
          result: { success: false, message: "Usuário não autenticado" },
        });
        return;
      }

      this.handleBattleCommand(client, payload, userData.userId);
    });
  }

  // =========================================
  // Battle Logic
  // =========================================

  private async startBattle() {
    console.log(`[ArenaRoom] ========== START BATTLE ==========`);
    console.log(`[ArenaRoom] Room: ${this.roomId}`);
    console.log(`[ArenaRoom] Players: ${this.state.players.length}`);

    this.lobbyPhase = false;
    this.state.status = "ACTIVE";
    console.log(`[ArenaRoom] Status setado para: ${this.state.status}`);

    // Gerar configuração do mapa
    const terrainType = getRandomTerrain();
    const territorySize = getRandomArenaSize();
    const { width, height } = getGridDimensions(territorySize);

    this.state.gridWidth = width;
    this.state.gridHeight = height;

    // Configurar mapa
    this.state.config.map.terrainType = terrainType;
    this.state.config.map.territorySize = territorySize;
    this.state.config.weather = "CLEAR";
    this.state.config.timeOfDay = 12;

    // Gerar obstáculos
    const obstacleCount = getObstacleCount(territorySize);
    this.generateObstacles(obstacleCount);

    // Criar unidades para cada jogador
    await this.createBattleUnits();

    // Inicializar QTE Manager
    this.initializeQTEManager();

    // Definir ordem de ação
    this.calculateActionOrder();

    // Iniciar timer de turno
    this.state.turnTimer = TURN_CONFIG.timerSeconds;
    this.startTurnTimer();

    // Atualizar metadata
    this.setMetadata({
      ...this.metadata,
      status: "BATTLING",
    });

    // Broadcast início da batalha
    this.broadcast("battle:started", {
      battleId: this.state.battleId,
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
      config: this.serializeConfig(),
    });
  }

  private generateObstacles(count: number) {
    const usedPositions = new Set<string>();

    // Reservar posições de spawn
    this.state.players.forEach((_, idx) => {
      const spawnX = idx === 0 ? 1 : this.state.gridWidth - 2;
      for (let y = 0; y < Math.min(3, this.state.gridHeight); y++) {
        usedPositions.add(`${spawnX},${y}`);
        usedPositions.add(`${spawnX + 1},${y}`);
      }
    });

    // Pegar o terreno atual para gerar tipos de obstáculos apropriados
    const terrainType = (this.state.config?.map?.terrainType ||
      "PLAINS") as Parameters<typeof getRandomObstacleType>[0];

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts < 50) {
        const x = Math.floor(Math.random() * this.state.gridWidth);
        const y = Math.floor(Math.random() * this.state.gridHeight);
        const key = `${x},${y}`;

        if (!usedPositions.has(key)) {
          usedPositions.add(key);

          const obstacle = new BattleObstacleSchema();
          obstacle.id = `obs_${i}`;
          obstacle.posX = x;
          obstacle.posY = y;
          // Usar novo sistema de tipos 2.5D
          obstacle.type = getRandomObstacleType(terrainType);
          obstacle.hp = 5;
          obstacle.maxHp = 5;
          obstacle.destroyed = false;

          this.state.obstacles.push(obstacle);
          break;
        }
        attempts++;
      }
    }
  }

  private async createBattleUnits() {
    for (const player of this.state.players) {
      if (player.isBot) {
        // Criar unidades de bot (simplificado)
        await this.createBotUnits(player);
        continue;
      }

      // Buscar unidades do reino
      const kingdom = await prisma.kingdom.findUnique({
        where: { id: player.kingdomId },
        include: {
          regent: true,
          troopTemplates: true,
        },
      });

      if (!kingdom) continue;

      // Converter TroopTemplates em formato compatível com troops
      // TroopTemplates não têm HP/Mana, precisamos calcular a partir de vitality/will
      const troops = kingdom.troopTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        avatar: template.avatar,
        category: "TROOP" as const,
        troopSlot: template.slotIndex,
        level: 1,
        classCode: null,
        features: JSON.stringify([template.passiveId]),
        equipment: null,
        spells: null,
        conditions: null,
        unitCooldowns: null,
        combat: template.combat,
        speed: template.speed,
        focus: template.focus,
        resistance: template.resistance,
        will: template.will,
        vitality: template.vitality,
        damageReduction: null,
        maxHp: template.vitality * HP_CONFIG.multiplier,
        currentHp: template.vitality * HP_CONFIG.multiplier,
        maxMana: template.will * MANA_CONFIG.multiplier,
        currentMana: template.will * MANA_CONFIG.multiplier,
        size: null,
      }));

      const units = await createBattleUnitsForArena(
        {
          ...kingdom,
          troops,
        },
        player.oderId,
        player.playerIndex,
        this.state.gridWidth,
        this.state.gridHeight
      );

      units.forEach((unit) => {
        const schema = BattleUnitSchema.fromBattleUnit(unit);
        this.state.units.set(unit.id, schema);
        this.state.actionOrder.push(unit.id);
      });
    }
  }

  private async createBotUnits(botPlayer: BattlePlayerSchema) {
    console.log(
      `[ArenaRoom] 🤖 createBotUnits chamado para player:`,
      botPlayer.oderId
    );

    // Implementação simplificada para bots
    // Na versão completa, usar createBotKingdom e createBattleUnitsForArena
    const botUnit = new BattleUnitSchema();
    botUnit.id = `bot_unit_${Date.now()}`;
    botUnit.sourceUnitId = "bot";
    botUnit.ownerId = botPlayer.oderId;
    botUnit.ownerKingdomId = botPlayer.kingdomId;
    botUnit.name = "Bot Warrior";
    botUnit.category = "REGENT";
    botUnit.level = 1;
    botUnit.race = "HUMAN";
    botUnit.combat = 10;
    botUnit.speed = 5;
    botUnit.focus = 5;
    botUnit.resistance = 5;
    botUnit.will = 5;
    botUnit.vitality = 20;
    botUnit.currentHp = 20;
    botUnit.maxHp = 20;
    botUnit.posX = this.state.gridWidth - 2;
    botUnit.posY = 1;
    botUnit.movesLeft = 5;
    botUnit.actionsLeft = 1;
    botUnit.attacksLeftThisTurn = 1;
    botUnit.actionMarks = getMaxMarksByCategory("REGENT"); // Bots são REGENT = 3 marks
    botUnit.isAIControlled = true;
    botUnit.isAlive = true;

    this.state.units.set(botUnit.id, botUnit);
    this.state.actionOrder.push(botUnit.id);

    console.log(`[ArenaRoom] 🤖 Bot unit criado:`, {
      id: botUnit.id,
      name: botUnit.name,
      isAIControlled: botUnit.isAIControlled,
      isAlive: botUnit.isAlive,
      posX: botUnit.posX,
      posY: botUnit.posY,
    });
  }

  private calculateActionOrder() {
    // Ordenar por speed (maior primeiro)
    const unitIds = Array.from(this.state.actionOrder).filter(
      (id): id is string => id !== undefined
    );
    unitIds.sort((a, b) => {
      const unitA = this.state.units.get(a);
      const unitB = this.state.units.get(b);
      if (!unitA || !unitB) return 0;
      return unitB.speed - unitA.speed;
    });

    this.state.actionOrder.clear();
    unitIds.forEach((id) => this.state.actionOrder.push(id));

    // Definir primeira unidade como ativa
    if (this.state.actionOrder.length > 0) {
      this.state.currentTurnIndex = 0;
      const firstUnitId = this.state.actionOrder[0];
      if (firstUnitId) {
        this.state.activeUnitId = firstUnitId;
        const unit = this.state.units.get(firstUnitId);
        if (unit) {
          this.state.currentPlayerId = unit.ownerId || "";
          // Inicializar turno da primeira unidade
          unit.movesLeft = unit.speed;
          unit.actionsLeft = 1;
          unit.attacksLeftThisTurn = 1;
          unit.hasStartedAction = false;

          // Se a primeira unidade é de IA, executar turno da IA
          if (unit.isAIControlled) {
            console.log(
              `[ArenaRoom] 🤖 Primeira unidade é IA: ${unit.name}, iniciando turno da IA`
            );
            this.executeAITurn(unit);
          }
        }
      }
    }
  }

  private startTurnTimer() {
    if (this.turnTimer) {
      this.turnTimer.clear();
    }

    this.turnTimer = this.clock.setInterval(() => {
      if (this.state.status !== "ACTIVE") {
        this.turnTimer?.clear();
        return;
      }

      this.state.turnTimer--;

      if (this.state.turnTimer <= 0) {
        this.advanceToNextUnit();
      }
    }, 1000);
  }

  private advanceToNextUnit() {
    console.log(`[ArenaRoom] advanceToNextUnit chamado`);

    // Encontrar próxima unidade viva
    let nextIndex =
      (this.state.currentTurnIndex + 1) % this.state.actionOrder.length;
    let attempts = 0;

    while (attempts < this.state.actionOrder.length) {
      const unitId = this.state.actionOrder[nextIndex];
      if (!unitId) {
        nextIndex = (nextIndex + 1) % this.state.actionOrder.length;
        attempts++;
        continue;
      }
      const unit = this.state.units.get(unitId);

      if (unit && unit.isAlive) {
        this.state.currentTurnIndex = nextIndex;
        this.state.activeUnitId = unitId;
        this.state.currentPlayerId = unit.ownerId;
        this.state.turnTimer = TURN_CONFIG.timerSeconds;

        // Resetar ações da unidade
        unit.hasStartedAction = false;
        unit.movesLeft = unit.speed;
        unit.actionsLeft = 1;
        unit.attacksLeftThisTurn = 1;

        // Verificar se completou uma rodada
        if (nextIndex === 0) {
          this.state.round++;
          this.processRoundEnd();
        }

        console.log(
          `[ArenaRoom] Turno para: ${unit.name} (isAIControlled: ${unit.isAIControlled})`
        );

        this.broadcast("battle:turn_changed", {
          activeUnitId: unitId,
          round: this.state.round,
          turnTimer: this.state.turnTimer,
        });

        // Se é unidade de IA, executar turno
        if (unit.isAIControlled) {
          console.log(
            `[ArenaRoom] 🤖 Unidade de IA detectada, executando turno`
          );
          this.executeAITurn(unit);
        }

        return;
      }

      nextIndex = (nextIndex + 1) % this.state.actionOrder.length;
      attempts++;
    }

    // Todas as unidades mortas - fim de jogo
    this.checkBattleEnd();
  }

  private processRoundEnd() {
    // Processar efeitos de fim de rodada para cada unidade
    this.state.units.forEach((unit) => {
      if (!unit.isAlive) return;

      // Reduzir cooldowns
      unit.unitCooldowns.forEach((value, key) => {
        if (value > 0) {
          unit.unitCooldowns.set(key, value - 1);
        }
      });

      // Processar condições temporárias
      // (implementação detalhada seria feita aqui)
    });

    this.broadcast("battle:round_ended", { round: this.state.round - 1 });
  }

  private executeAITurn(unit: BattleUnitSchema) {
    console.log(
      `[ArenaRoom] 🤖 executeAITurn iniciado para: ${unit.name} (${unit.id})`
    );

    // IA simplificada - mover em direção ao inimigo mais próximo e atacar
    setTimeout(() => {
      console.log(`[ArenaRoom] 🤖 IA processando turno de: ${unit.name}`);

      // Encontrar inimigo mais próximo
      let closestEnemy: BattleUnitSchema | undefined = undefined;
      let closestDist = Infinity;

      this.state.units.forEach((other) => {
        if (other.ownerId === unit.ownerId || !other.isAlive) return;

        const dist =
          Math.abs(other.posX - unit.posX) + Math.abs(other.posY - unit.posY);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = other;
        }
      });

      if (!closestEnemy) {
        console.log(
          `[ArenaRoom] 🤖 IA: Nenhum inimigo encontrado, passando turno`
        );
        this.advanceToNextUnit();
        return;
      }

      const enemy = closestEnemy as BattleUnitSchema;
      console.log(
        `[ArenaRoom] 🤖 IA: Inimigo mais próximo: ${enemy.name} a ${closestDist} células`
      );

      // Mover em direção ao inimigo
      const dx = Math.sign(enemy.posX - unit.posX);
      const dy = Math.sign(enemy.posY - unit.posY);

      if (unit.movesLeft > 0 && closestDist > 1) {
        const newX = unit.posX + dx;
        const newY = unit.posY + dy;

        if (this.isValidPosition(newX, newY)) {
          const fromX = unit.posX;
          const fromY = unit.posY;
          unit.posX = newX;
          unit.posY = newY;
          unit.movesLeft--;

          console.log(
            `[ArenaRoom] 🤖 IA: ${unit.name} moveu de (${fromX},${fromY}) para (${newX},${newY})`
          );

          this.broadcast("battle:unit_moved", {
            unitId: unit.id,
            fromX,
            fromY,
            toX: newX,
            toY: newY,
            movesLeft: unit.movesLeft,
          });
        } else {
          console.log(
            `[ArenaRoom] 🤖 IA: Posição (${newX},${newY}) inválida, não moveu`
          );
        }
      }

      // Atacar se adjacente e tem recurso para atacar
      const newDist =
        Math.abs(enemy.posX - unit.posX) + Math.abs(enemy.posY - unit.posY);
      if (newDist <= 1 && this.canAttack(unit)) {
        console.log(`[ArenaRoom] 🤖 IA: ${unit.name} atacando ${enemy.name}`);
        this.performAttack(unit, enemy);
      } else {
        console.log(
          `[ArenaRoom] 🤖 IA: Distância ${newDist}, ataques restantes: ${unit.attacksLeftThisTurn}, ações: ${unit.actionsLeft}, não atacou`
        );
      }

      // Fim do turno da IA
      console.log(`[ArenaRoom] 🤖 IA: ${unit.name} finalizando turno`);
      this.advanceToNextUnit();
    }, 1000);
  }

  private isValidPosition(x: number, y: number): boolean {
    // Verificar limites do grid
    if (
      x < 0 ||
      x >= this.state.gridWidth ||
      y < 0 ||
      y >= this.state.gridHeight
    ) {
      return false;
    }

    // Verificar obstáculos
    for (const obs of this.state.obstacles) {
      if (!obs.destroyed && obs.posX === x && obs.posY === y) {
        return false;
      }
    }

    // Verificar outras unidades
    let occupied = false;
    this.state.units.forEach((unit) => {
      if (unit.isAlive && unit.posX === x && unit.posY === y) {
        occupied = true;
      }
    });

    return !occupied;
  }

  /**
   * Verifica se a unidade pode atacar e consome recursos corretamente.
   * @returns true se o ataque pode ser executado, false se não há recursos
   */
  private consumeAttackResource(attacker: BattleUnitSchema): boolean {
    // Se já tem ataques restantes (ex: ataques extras), apenas decrementa
    if (attacker.attacksLeftThisTurn > 0) {
      attacker.attacksLeftThisTurn--;
      return true;
    }

    // Se não tem ataques restantes, precisa usar uma ação
    if (attacker.actionsLeft <= 0) {
      return false;
    }

    // Consumir ação e calcular ataques extras baseados em condições
    attacker.actionsLeft--;
    const conditions = Array.from(attacker.conditions).filter(
      (c): c is string => typeof c === "string"
    );
    const hasProtection = attacker.physicalProtection > 0;
    const extraAttacks = getExtraAttacksFromConditions(
      conditions,
      hasProtection
    );

    // O primeiro ataque da ação é consumido imediatamente
    // Os extras ficam disponíveis em attacksLeftThisTurn
    attacker.attacksLeftThisTurn = extraAttacks;

    return true;
  }

  /**
   * Verifica se a unidade tem recursos para atacar (sem consumir)
   */
  private canAttack(attacker: BattleUnitSchema): boolean {
    return attacker.attacksLeftThisTurn > 0 || attacker.actionsLeft > 0;
  }

  /**
   * Executa o ataque com modificadores do QTE
   * @param attacker Unidade atacante
   * @param target Unidade alvo
   * @param attackModifier Modificador de dano do atacante (QTE) - padrão 1.0
   * @param defenseModifier Modificador de redução do defensor (QTE) - padrão 1.0
   */
  private performAttack(
    attacker: BattleUnitSchema,
    target: BattleUnitSchema,
    attackModifier: number = 1.0,
    defenseModifier: number = 1.0
  ) {
    const baseDamage = Math.max(1, attacker.combat - target.damageReduction);

    // Aplicar modificadores do QTE
    const modifiedDamage = Math.floor(
      baseDamage * attackModifier * defenseModifier
    );
    const finalDamage = Math.max(1, modifiedDamage);

    // Aplicar dano usando função centralizada (ataque físico)
    const result = applyDamage(
      target.physicalProtection,
      target.magicalProtection,
      target.currentHp,
      finalDamage,
      "FISICO"
    );
    target.physicalProtection = result.newPhysicalProtection;
    target.magicalProtection = result.newMagicalProtection;
    target.currentHp = result.newHp;

    const targetDefeated = target.currentHp <= 0;
    if (targetDefeated) {
      target.isAlive = false;
    }

    // Consumir recurso de ataque
    this.consumeAttackResource(attacker);

    this.broadcast("battle:unit_attacked", {
      attackerId: attacker.id,
      targetId: target.id,
      damage: finalDamage,
      baseDamage,
      attackModifier,
      defenseModifier,
      targetHpAfter: target.currentHp,
      targetDefeated,
    });

    if (targetDefeated) {
      this.checkBattleEnd();
    }
  }

  // =========================================
  // Message Handler Implementations
  // =========================================

  private handleBeginAction(client: Client, unitId: string) {
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const unit = this.state.units.get(unitId);
    if (!unit) {
      client.send("error", { message: "Unidade não encontrada" });
      return;
    }

    if (unit.ownerId !== userData.userId) {
      client.send("error", { message: "Esta unidade não é sua" });
      return;
    }

    if (this.state.activeUnitId !== unitId) {
      client.send("error", { message: "Não é o turno desta unidade" });
      return;
    }

    unit.hasStartedAction = true;

    this.broadcast("battle:action_started", { unitId });
  }

  private handleMove(client: Client, unitId: string, toX: number, toY: number) {
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const unit = this.state.units.get(unitId);
    if (!unit) {
      client.send("error", { message: "Unidade não encontrada" });
      return;
    }

    if (unit.ownerId !== userData.userId) {
      client.send("error", { message: "Esta unidade não é sua" });
      return;
    }

    // Calcular distância
    const distance = Math.abs(toX - unit.posX) + Math.abs(toY - unit.posY);

    if (distance > unit.movesLeft) {
      client.send("error", { message: "Movimento insuficiente" });
      return;
    }

    if (!this.isValidPosition(toX, toY)) {
      client.send("error", { message: "Posição inválida" });
      return;
    }

    const fromX = unit.posX;
    const fromY = unit.posY;

    unit.posX = toX;
    unit.posY = toY;
    unit.movesLeft -= distance;

    this.broadcast("battle:unit_moved", {
      unitId,
      fromX,
      fromY,
      toX,
      toY,
      movesLeft: unit.movesLeft,
    });
  }

  private handleAttack(
    client: Client,
    attackerId: string,
    targetId?: string,
    targetObstacleId?: string,
    targetPosition?: { x: number; y: number }
  ) {
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const attacker = this.state.units.get(attackerId);
    if (!attacker) {
      client.send("error", { message: "Atacante não encontrado" });
      return;
    }

    if (attacker.ownerId !== userData.userId) {
      client.send("error", { message: "Esta unidade não é sua" });
      return;
    }

    // Verificar se tem recursos para atacar (ação ou ataques extras)
    if (!this.canAttack(attacker)) {
      client.send("error", { message: "Sem ataques ou ações restantes" });
      return;
    }

    if (targetId) {
      const target = this.state.units.get(targetId);
      if (!target) {
        client.send("error", { message: "Alvo não encontrado" });
        return;
      }

      // Verificar alcance (adjacente)
      const distance =
        Math.abs(target.posX - attacker.posX) +
        Math.abs(target.posY - attacker.posY);
      if (distance > 1) {
        client.send("error", { message: "Alvo fora de alcance" });
        return;
      }

      // Iniciar QTE de ataque em vez de atacar diretamente
      this.startAttackQTE(client, attacker, target);
    } else if (targetObstacleId) {
      // Atacar obstáculo
      const obstacle = this.state.obstacles.find(
        (o) => o.id === targetObstacleId
      );
      if (!obstacle) {
        client.send("error", { message: "Obstáculo não encontrado" });
        return;
      }

      const distance =
        Math.abs(obstacle.posX - attacker.posX) +
        Math.abs(obstacle.posY - attacker.posY);
      if (distance > 1) {
        client.send("error", { message: "Obstáculo fora de alcance" });
        return;
      }

      // Consumir recurso de ataque
      this.consumeAttackResource(attacker);

      obstacle.hp -= attacker.combat;

      if (obstacle.hp <= 0) {
        obstacle.destroyed = true;
      }

      this.broadcast("battle:obstacle_attacked", {
        attackerId,
        obstacleId: targetObstacleId,
        damage: attacker.combat,
        destroyed: obstacle.destroyed,
      });
    } else if (targetPosition) {
      // Ataque direcional - verificar se há unidade ou obstáculo na posição
      const distance =
        Math.abs(targetPosition.x - attacker.posX) +
        Math.abs(targetPosition.y - attacker.posY);

      // Attack range base é 1 (melee), mas pode ser modificado por condições
      const baseAttackRange = 1;
      if (distance > baseAttackRange) {
        client.send("error", { message: "Posição fora de alcance" });
        return;
      }

      // Verificar se há uma unidade na posição
      const unitAtPosition = Array.from(this.state.units.values()).find(
        (u) =>
          u.posX === targetPosition.x &&
          u.posY === targetPosition.y &&
          u.isAlive
      );

      if (unitAtPosition) {
        // Atacar a unidade encontrada
        this.handleAttack(client, attackerId, unitAtPosition.id);
        return;
      }

      // Verificar se há um obstáculo na posição
      const obstacleAtPosition = Array.from(this.state.obstacles.values()).find(
        (o) =>
          o.posX === targetPosition.x &&
          o.posY === targetPosition.y &&
          !o.destroyed
      );

      if (obstacleAtPosition) {
        // Atacar o obstáculo encontrado
        this.handleAttack(client, attackerId, undefined, obstacleAtPosition.id);
        return;
      }

      // Nenhum alvo na posição - ataque no ar (miss)
      // Consumir recurso de ataque
      this.consumeAttackResource(attacker);
      attacker.hasStartedAction = true;

      // Notificar que o ataque foi no ar (miss)
      this.broadcast("battle:attack_missed", {
        attackerId,
        targetPosition,
        message: "O ataque não atingiu nenhum alvo!",
        actionsLeft: attacker.actionsLeft,
        attacksLeftThisTurn: attacker.attacksLeftThisTurn,
      });

      console.log(
        `[ArenaRoom] ⚔️ Ataque no ar: ${attacker.name} atacou posição (${targetPosition.x}, ${targetPosition.y}) sem alvo`
      );
    }
  }

  private handleEndAction(client: Client, unitId: string) {
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const unit = this.state.units.get(unitId);
    if (!unit || unit.ownerId !== userData.userId) {
      return;
    }

    if (this.state.activeUnitId !== unitId) {
      return;
    }

    this.advanceToNextUnit();
  }

  private handleExecuteAction(
    client: Client,
    actionName: string,
    unitId: string,
    params?: Record<string, unknown>
  ) {
    // Implementação de ações especiais (skills)
    // Delegar para sistema de skills existente
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const unit = this.state.units.get(unitId);
    if (!unit || unit.ownerId !== userData.userId) {
      client.send("error", { message: "Ação inválida" });
      return;
    }

    // TODO: Integrar com sistema de skills existente
    this.broadcast("battle:action_executed", {
      actionName,
      unitId,
      params,
      success: true,
    });
  }

  private handleCastSpell(
    client: Client,
    unitId: string,
    spellCode: string,
    targetId?: string,
    targetPosition?: { x: number; y: number }
  ) {
    // Implementação de magias
    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    const unit = this.state.units.get(unitId);
    if (!unit || unit.ownerId !== userData.userId) {
      client.send("error", { message: "Não pode lançar magia" });
      return;
    }

    // TODO: Integrar com sistema de spells existente
    this.broadcast("battle:spell_cast", {
      unitId,
      spellCode,
      targetId,
      targetPosition,
      success: true,
    });
  }

  /**
   * Handler para comandos de batalha (ex: /spawn, /godmode)
   */
  private handleBattleCommand(
    client: Client,
    payload: CommandPayload,
    userId: string
  ) {
    const { commandCode, args, selectedUnitId } = payload;

    // Verificar se a batalha está ativa
    if (this.state.status !== "ACTIVE") {
      client.send("battle:command:response", {
        commandCode,
        result: {
          success: false,
          message: "Comandos só podem ser executados durante uma batalha ativa",
        },
      });
      return;
    }

    // Buscar unidade selecionada se fornecida
    let selectedUnit = null;
    if (selectedUnitId) {
      selectedUnit = this.state.units.get(selectedUnitId) || null;
    }

    // Criar contexto de execução
    const context = {
      battleState: this.state,
      userId,
      selectedUnit,
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
    };

    // Executar comando
    const result = handleCommand(payload, context);

    // Enviar resposta ao cliente
    client.send("battle:command:response", {
      commandCode,
      result,
    });

    // Se sucesso, fazer broadcast de feedback para todos
    if (result.success) {
      this.broadcast("battle:command:executed", {
        commandCode,
        userId,
        message: result.message,
      });
    }
  }

  private handleSurrender(userId: string) {
    const player = this.state.getPlayer(userId);
    if (!player || player.surrendered) return;

    player.surrendered = true;

    // Matar todas as unidades do jogador
    this.state.units.forEach((unit) => {
      if (unit.ownerId === userId) {
        unit.isAlive = false;
        unit.currentHp = 0;
      }
    });

    this.broadcast("battle:player_surrendered", { userId });

    this.checkBattleEnd();
  }

  private handleRematchRequest(userId: string) {
    if (this.state.status !== "ENDED") return;

    this.rematchRequests.add(userId);
    this.state.rematchRequests.push(userId);

    this.broadcast("battle:rematch_requested", { userId });

    // Se todos pediram rematch, criar nova batalha
    const alivePlayers = this.state.players.filter((p) => !p.surrendered);
    if (
      this.rematchRequests.size >= alivePlayers.length &&
      alivePlayers.length >= 2
    ) {
      this.broadcast("battle:rematch_starting", {});
      // Reset e reiniciar
      this.resetForRematch();
    }
  }

  private resetForRematch() {
    // Limpar estado
    this.state.units.clear();
    this.state.obstacles.clear();
    this.state.actionOrder.clear();
    this.state.logs.clear();
    this.state.rematchRequests.clear();
    this.rematchRequests.clear();

    // Resetar jogadores
    this.state.players.forEach((p) => {
      p.surrendered = false;
    });

    // Resetar estado da batalha
    this.state.status = "ACTIVE";
    this.state.round = 1;
    this.state.currentTurnIndex = 0;
    this.state.activeUnitId = "";
    this.state.winnerId = "";
    this.state.winReason = "";

    // Reiniciar batalha
    this.startBattle();
  }

  private checkBattleEnd() {
    // Contar jogadores com unidades vivas
    const playersAlive: string[] = [];

    this.state.players.forEach((player) => {
      if (player.surrendered) return;

      if (this.state.playerHasAliveUnits(player.oderId)) {
        playersAlive.push(player.oderId);
      }
    });

    // Se só resta um jogador, ele vence
    if (playersAlive.length <= 1) {
      this.state.status = "ENDED";

      if (playersAlive.length === 1) {
        this.state.winnerId = playersAlive[0];
        this.state.winReason = "Todas as unidades inimigas foram derrotadas";
      } else {
        this.state.winReason = "Empate - todos foram derrotados";
      }

      // Parar timer
      if (this.turnTimer) {
        this.turnTimer.clear();
      }

      // Marcar batalha como terminada no banco (se foi persistida antes)
      markBattleEnded(
        this.roomId,
        this.state.winnerId || undefined,
        this.state.winReason || undefined
      ).catch((err) =>
        console.error("[ArenaRoom] Erro ao marcar batalha como ENDED:", err)
      );

      this.broadcast("battle:ended", {
        winnerId: this.state.winnerId,
        winReason: this.state.winReason,
      });
    }
  }

  // =========================================
  // Helper Methods
  // =========================================

  private async addBotPlayer() {
    console.log(`[ArenaRoom] addBotPlayer() chamado`);
    const botPlayer = new BattlePlayerSchema();
    botPlayer.oderId = `bot_${Date.now()}`;
    botPlayer.kingdomId = `bot_kingdom_${Date.now()}`;
    botPlayer.kingdomName = "Reino do Bot";
    botPlayer.username = "Bot";
    botPlayer.playerIndex = this.state.players.length;
    botPlayer.playerColor =
      PLAYER_COLORS[botPlayer.playerIndex % PLAYER_COLORS.length];
    botPlayer.isConnected = true;
    botPlayer.isBot = true;

    this.state.players.push(botPlayer);
  }

  private getPlayersInfo() {
    return this.state.players.map((p) => ({
      oderId: p.oderId,
      username: p.username,
      kingdomName: p.kingdomName,
      playerIndex: p.playerIndex,
      playerColor: p.playerColor,
      isBot: p.isBot,
    }));
  }

  private serializeConfig() {
    return {
      map: {
        terrainType: this.state.config.map.terrainType,
        territorySize: this.state.config.map.territorySize,
        obstacles: Array.from(this.state.obstacles)
          .filter((o): o is NonNullable<typeof o> => o !== undefined)
          .map((o) => ({
            id: o.id,
            posX: o.posX,
            posY: o.posY,
            emoji: o.emoji,
            hp: o.hp,
            maxHp: o.maxHp,
          })),
      },
      weather: this.state.config.weather,
      timeOfDay: this.state.config.timeOfDay,
    };
  }

  // =========================================
  // QTE (Quick Time Event) System
  // =========================================

  /**
   * Inicializa o gerenciador de QTE para esta batalha
   * Usa this.clock.currentTime como fonte de verdade para sincronização
   */
  private initializeQTEManager() {
    // Funções de callback para o QTE Manager
    const broadcastFn = (event: string, data: unknown) => {
      this.broadcast(event, data);
    };

    const sendToClientFn = (userId: string, event: string, data: unknown) => {
      this.clients.forEach((client) => {
        const userData = client.userData as { userId: string } | undefined;
        if (userData?.userId === userId) {
          client.send(event, data);
        }
      });
    };

    // Função para obter o tempo do servidor (clock do Colyseus)
    const getServerTime = () => this.clock.currentTime;

    this.qteManager = new QTEManager(
      broadcastFn,
      sendToClientFn,
      getServerTime
    );

    // Atualizar estado inicial
    this.updateQTEManagerUnits();
  }

  /**
   * Converte um BattleUnitSchema para BattleUnit (tipos simples)
   */
  private schemaUnitToBattleUnit(schema: BattleUnitSchema): BattleUnit {
    return {
      id: schema.id,
      sourceUnitId: schema.sourceUnitId,
      ownerId: schema.ownerId,
      ownerKingdomId: schema.ownerKingdomId,
      name: schema.name,
      avatar: schema.avatar,
      category: schema.category,
      troopSlot: schema.troopSlot,
      level: schema.level,
      race: schema.race,
      classCode: schema.classCode,
      features: Array.from(schema.features).filter(
        (f): f is string => f !== undefined
      ),
      equipment: Array.from(schema.equipment).filter(
        (e): e is string => e !== undefined
      ),
      combat: schema.combat,
      speed: schema.speed,
      focus: schema.focus,
      resistance: schema.resistance,
      will: schema.will,
      vitality: schema.vitality,
      damageReduction: schema.damageReduction,
      currentHp: schema.currentHp,
      maxHp: schema.maxHp,
      currentMana: schema.currentMana,
      maxMana: schema.maxMana,
      posX: schema.posX,
      posY: schema.posY,
      movesLeft: schema.movesLeft,
      actionsLeft: schema.actionsLeft,
      attacksLeftThisTurn: schema.attacksLeftThisTurn,
      isAlive: schema.isAlive,
      actionMarks: schema.actionMarks,
      physicalProtection: schema.physicalProtection,
      maxPhysicalProtection: schema.maxPhysicalProtection,
      magicalProtection: schema.magicalProtection,
      maxMagicalProtection: schema.maxMagicalProtection,
      conditions: Array.from(schema.conditions).filter(
        (c): c is string => c !== undefined
      ),
      spells: Array.from(schema.spells).filter(
        (s): s is string => s !== undefined
      ),
      hasStartedAction: schema.hasStartedAction,
      grabbedByUnitId: schema.grabbedByUnitId || undefined,
      size: schema.size as BattleUnit["size"],
      visionRange: schema.visionRange,
      unitCooldowns: Object.fromEntries(schema.unitCooldowns.entries()),
      isAIControlled: schema.isAIControlled,
      aiBehavior: schema.aiBehavior as BattleUnit["aiBehavior"],
    };
  }

  /**
   * Inicia um QTE de ataque
   */
  private startAttackQTE(
    client: Client,
    attacker: BattleUnitSchema,
    target: BattleUnitSchema
  ) {
    if (!this.qteManager) {
      // Fallback: se QTE não está disponível, atacar diretamente
      console.warn(
        "[ArenaRoom] QTE Manager não inicializado, atacando diretamente"
      );
      this.performAttack(attacker, target);
      return;
    }

    // Atualizar unidades no QTE Manager
    this.updateQTEManagerUnits();

    // Converter para BattleUnit
    const attackerUnit = this.schemaUnitToBattleUnit(attacker);
    const targetUnit = this.schemaUnitToBattleUnit(target);

    // Calcular dano base
    const baseDamage = Math.max(1, attacker.combat - target.damageReduction);

    // Iniciar o fluxo de QTE com callback de conclusão
    this.qteManager.initiateAttack(
      attackerUnit,
      targetUnit,
      this.state.battleId,
      baseDamage,
      false, // isMagicAttack
      (result) => {
        // Callback quando o QTE completa
        this.handleQTECombatComplete(attacker.id, target.id, result);
      }
    );
  }

  /**
   * Callback chamado quando um combate QTE completa
   */
  private handleQTECombatComplete(
    attackerId: string,
    targetId: string,
    result: import("../../qte").QTECombatResult
  ) {
    const attacker = this.state.units.get(attackerId);
    const target = this.state.units.get(targetId);

    if (!attacker || !target) return;

    if (result.dodged) {
      // A esquiva foi bem-sucedida - atualizar posição
      if (result.newDefenderPosition) {
        const fromX = target.posX;
        const fromY = target.posY;
        target.posX = result.newDefenderPosition.x;
        target.posY = result.newDefenderPosition.y;

        this.broadcast("battle:unit_dodged", {
          unitId: targetId,
          fromX,
          fromY,
          toX: result.newDefenderPosition.x,
          toY: result.newDefenderPosition.y,
        });
      }

      // Se foi esquiva perfeita, aplicar buff
      if (result.defenderQTE?.grade === "PERFECT") {
        target.conditions.push("ADRENALINE_RUSH");
        this.broadcast("battle:condition_applied", {
          unitId: targetId,
          conditionId: "ADRENALINE_RUSH",
        });
      }

      // Descontar ataque do atacante mesmo com esquiva
      this.consumeAttackResource(attacker);

      this.broadcast("battle:attack_dodged", {
        attackerId,
        targetId,
        attackerQTE: result.attackerQTE,
        defenderQTE: result.defenderQTE,
      });
    } else {
      // Aplicar dano com modificadores
      this.performAttack(
        attacker,
        target,
        result.attackerDamageModifier,
        result.defenderDamageModifier
      );
    }
  }

  /**
   * Processa a resposta de um QTE
   */
  private handleQTEResponse(client: Client, response: QTEResponse) {
    if (!this.qteManager) {
      client.send("error", { message: "QTE não está ativo" });
      return;
    }

    const userData = client.userData as { userId: string } | undefined;
    if (!userData) return;

    // Verificar se o jogador é o dono da unidade que deve responder
    const unit = this.state.units.get(response.unitId);
    if (!unit || unit.ownerId !== userData.userId) {
      client.send("error", { message: "Não é sua vez de responder ao QTE" });
      return;
    }

    // Processar a resposta
    this.qteManager.processResponse(response);
  }

  /**
   * Atualiza as unidades no QTE Manager com o estado atual
   */
  private updateQTEManagerUnits() {
    if (!this.qteManager) return;

    const units: BattleUnit[] = [];
    this.state.units.forEach((schemaUnit) => {
      units.push(this.schemaUnitToBattleUnit(schemaUnit));
    });

    const obstacles = Array.from(this.state.obstacles)
      .filter((o): o is NonNullable<typeof o> => o !== undefined)
      .map((o) => ({
        id: o.id,
        posX: o.posX,
        posY: o.posY,
        type: o.type,
        hp: o.hp,
        maxHp: o.maxHp,
        destroyed: o.destroyed,
      }));

    this.qteManager.updateBattleState(
      units,
      obstacles as any,
      this.state.gridWidth,
      this.state.gridHeight
    );
  }
}
