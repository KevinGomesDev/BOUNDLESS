import { generateBattleMap } from "../../logic/battle-map";
import {
  BattleUnit,
  createBattleUnitsWithRandomPositions,
  determineActionOrder,
  getArenaBattleGridSize,
  sortByInitiative,
} from "../../utils/battle-unit.factory";
import type { ArenaConfig } from "../../../../shared/types/arena.types";
import type { Battle } from "./battle-types";
import type { BattleLobby } from "./battle-types";
import { generateId } from "./battle-types";
import { activeBattles, battleLobbies } from "./battle-state";
import {
  createBaseArenaConfig,
  saveBattleToDB,
  saveLobbyToDB,
} from "./battle-persistence";
import { startBattleTurnTimer } from "./battle-timer";

interface CreateBattleParams {
  lobby: BattleLobby;
  hostKingdom: any;
  guestKingdom: any;
  io: any;
  isRematch?: boolean;
}

export async function createAndStartBattle({
  lobby,
  hostKingdom,
  guestKingdom,
  io,
  isRematch = false,
}: CreateBattleParams): Promise<Battle> {
  const lobbyId = lobby.lobbyId;
  const {
    width: gridWidth,
    height: gridHeight,
    territorySize,
  } = getArenaBattleGridSize();

  const battleId = generateId();

  const { units: allUnits, occupiedPositions } =
    createBattleUnitsWithRandomPositions(
      hostKingdom.units,
      lobby.hostUserId,
      { id: hostKingdom.id, name: hostKingdom.name },
      guestKingdom.units,
      lobby.guestUserId as string,
      { id: guestKingdom.id, name: guestKingdom.name },
      gridWidth,
      gridHeight,
      "arena"
    );

  const orderedUnits = sortByInitiative(allUnits);
  const initiativeOrder = orderedUnits.map((u) => u.id);

  const actionOrder = determineActionOrder(
    allUnits,
    lobby.hostUserId,
    lobby.guestUserId as string
  );

  const mapConfig = generateBattleMap({
    gridWidth,
    gridHeight,
    territorySize,
    unitPositions: occupiedPositions,
  });

  const arenaConfig: ArenaConfig = {
    ...createBaseArenaConfig(),
    grid: { width: gridWidth, height: gridHeight },
    map: mapConfig,
  };

  const battle: Battle = {
    id: battleId,
    lobbyId,
    gridWidth,
    gridHeight,
    round: 1,
    currentTurnIndex: 0,
    status: "ACTIVE",
    turnTimer: 0,
    initiativeOrder,
    actionOrder,
    units: orderedUnits,
    logs: isRematch
      ? []
      : [
          {
            id: generateId(),
            timestamp: new Date(),
            type: "START",
            payload: {
              hostKingdomName: hostKingdom.name,
              guestKingdomName: guestKingdom.name,
            },
          },
        ],
    createdAt: new Date(),
    config: arenaConfig,
    roundActionsCount: new Map<string, number>([
      [lobby.hostUserId, 0],
      [lobby.guestUserId as string, 0],
    ]),
    hostUserId: lobby.hostUserId,
    guestUserId: lobby.guestUserId as string,
    hostKingdomId: hostKingdom.id,
    guestKingdomId: guestKingdom.id,
    isArena: true,
  };

  activeBattles.set(battleId, battle);
  lobby.status = "BATTLING";

  await saveBattleToDB(battle);
  await saveLobbyToDB(lobby);

  const battleEventData = {
    battleId,
    lobbyId,
    config: arenaConfig,
    units: orderedUnits,
    initiativeOrder,
    actionOrder,
    hostKingdom: {
      id: hostKingdom.id,
      name: hostKingdom.name,
      ownerId: lobby.hostUserId,
    },
    guestKingdom: {
      id: guestKingdom.id,
      name: guestKingdom.name,
      ownerId: lobby.guestUserId,
    },
  };

  if (isRematch) {
    io.to(lobbyId).emit("battle:rematch_started", battleEventData);
  } else {
    io.to(lobbyId).emit("battle:battle_started", battleEventData);
  }

  startBattleTurnTimer(battle);

  const logType = isRematch
    ? "🔄 REVANCHE INICIADA"
    : "🗺️  NOVA BATALHA INICIADA";
  console.log("\n" + "=".repeat(60));
  console.log(`[ARENA] ${logType}`);
  console.log("=".repeat(60));
  console.log(`[ARENA] ID da Batalha: ${battleId}`);
  console.log(`[ARENA] Lobby ID: ${lobbyId}`);
  console.log(`[ARENA] Host: ${hostKingdom.name} (${lobby.hostUserId})`);
  console.log(`[ARENA] Guest: ${guestKingdom.name} (${lobby.guestUserId})`);
  console.log("-".repeat(60));
  console.log("[ARENA] 📐 GRID:");
  console.log(`[ARENA]   Tamanho do Território: ${territorySize}`);
  console.log(
    `[ARENA]   Dimensões: ${gridWidth}x${gridHeight} (${
      gridWidth * gridHeight
    } células)`
  );
  console.log("-".repeat(60));
  console.log("[ARENA] 🌤️  CLIMA E TERRENO:");
  console.log(
    `[ARENA]   Clima: ${mapConfig.weatherName} ${mapConfig.weatherEmoji}`
  );
  console.log(`[ARENA]   Efeito: ${mapConfig.weatherEffect}`);
  console.log(`[ARENA]   Terreno: ${mapConfig.terrainName}`);
  console.log("-".repeat(60));
  console.log("[ARENA] 🪨 OBSTÁCULOS:");
  console.log(`[ARENA]   Quantidade: ${mapConfig.obstacles.length}`);
  if (mapConfig.obstacles.length > 0) {
    console.log(
      `[ARENA]   Posições: ${mapConfig.obstacles
        .map((o) => `(${o.posX},${o.posY})`)
        .join(", ")}`
    );
  }
  console.log("-".repeat(60));
  console.log("[ARENA] ⚔️  UNIDADES:");
  orderedUnits.forEach((unit, idx) => {
    const side = unit.ownerId === lobby.hostUserId ? "HOST" : "GUEST";
    console.log(
      `[ARENA]   ${idx + 1}. [${side}] ${unit.name} - Pos: (${unit.posX},${
        unit.posY
      }) - Initiative: ${unit.initiative}`
    );
  });
  console.log("-".repeat(60));
  console.log("[ARENA] 🎲 ORDEM DE AÇÃO:");
  console.log(
    `[ARENA]   ${actionOrder
      .map(
        (id, i) =>
          `${i + 1}. ${
            id === lobby.hostUserId ? hostKingdom.name : guestKingdom.name
          }`
      )
      .join(" → ")}`
  );
  console.log("=".repeat(60) + "\n");

  return battle;
}
