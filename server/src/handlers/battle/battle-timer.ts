import { getBattleIo } from "./battle-state";
import {
  activeBattles,
  battleDiceModalPaused,
  battleLobbies,
  battleTimerIntervals,
  disconnectedPlayers,
  userToLobby,
} from "./battle-state";
import {
  deleteBattleFromDB,
  deleteLobbyFromDB,
  saveBattleToDB,
  updateUserStats,
} from "./battle-persistence";
import {
  getEffectiveAcuityWithConditions,
  getMaxMarksByCategory,
} from "../../utils/battle.utils";
import type { Battle } from "./battle-types";
import { TURN_TIMER_SECONDS } from "./battle-types";

function hasConnectedPlayers(battle: Battle): boolean {
  const lobby = battleLobbies.get(battle.lobbyId);
  if (!lobby) return false;

  const hostDisconnected = disconnectedPlayers.has(battle.hostUserId);
  const guestDisconnected = disconnectedPlayers.has(battle.guestUserId);

  return !hostDisconnected || !guestDisconnected;
}

export function startBattleTurnTimer(battle: Battle): void {
  stopBattleTurnTimer(battle.id);

  if (battle.status === "ENDED") {
    console.log(
      `[ARENA] Timer não iniciado - batalha ${battle.id} já terminou`
    );
    return;
  }

  if (!hasConnectedPlayers(battle)) {
    console.log(
      `[ARENA] Timer não iniciado - nenhum jogador conectado na batalha ${battle.id}`
    );
    return;
  }

  battle.turnTimer = TURN_TIMER_SECONDS;

  const lobby = battleLobbies.get(battle.lobbyId);
  const io = getBattleIo();
  if (!lobby || !io) return;

  io.to(lobby.lobbyId).emit("battle:turn_timer", {
    battleId: battle.id,
    timer: battle.turnTimer,
    currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
  });

  const interval = setInterval(() => {
    if (battleDiceModalPaused.get(battle.id)) {
      return;
    }

    battle.turnTimer--;

    if (battle.turnTimer <= 0) {
      stopBattleTurnTimer(battle.id);
      void handleTimerExpired(battle);
    } else {
      const currentLobby = battleLobbies.get(battle.lobbyId);
      const currentIo = getBattleIo();
      if (currentLobby && currentIo) {
        currentIo.to(currentLobby.lobbyId).emit("battle:turn_timer", {
          battleId: battle.id,
          timer: battle.turnTimer,
          currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
        });
      }
    }
  }, 1000);

  battleTimerIntervals.set(battle.id, interval);
}

export function stopBattleTurnTimer(battleId: string): void {
  const interval = battleTimerIntervals.get(battleId);
  if (interval) {
    clearInterval(interval);
    battleTimerIntervals.delete(battleId);
  }
}

export function cleanupBattle(battleId: string): void {
  stopBattleTurnTimer(battleId);
  battleDiceModalPaused.delete(battleId);
  activeBattles.delete(battleId);
}

export function pauseBattleTimerIfNoPlayers(battleId: string): void {
  const battle = activeBattles.get(battleId);
  if (!battle) return;

  if (!hasConnectedPlayers(battle)) {
    console.log(
      `[ARENA] Pausando timer - todos os jogadores desconectaram da batalha ${battleId}`
    );
    stopBattleTurnTimer(battleId);
  }
}

export function resumeBattleTimer(battleId: string): void {
  const battle = activeBattles.get(battleId);
  if (!battle) {
    console.log(
      `[ARENA] resumeBattleTimer: Batalha ${battleId} não encontrada`
    );
    return;
  }

  const hasPlayers = hasConnectedPlayers(battle);
  const hasTimer = battleTimerIntervals.has(battleId);

  console.log(
    `[ARENA] resumeBattleTimer: battleId=${battleId}, hasPlayers=${hasPlayers}, hasTimer=${hasTimer}, currentTimer=${battle.turnTimer}`
  );

  if (!hasTimer && hasPlayers) {
    console.log(
      `[ARENA] Retomando timer - jogador reconectou na batalha ${battleId}`
    );
    startBattleTurnTimer(battle);
  } else if (hasTimer && hasPlayers) {
    const lobby = battleLobbies.get(battle.lobbyId);
    const io = getBattleIo();
    if (lobby && io) {
      io.to(lobby.lobbyId).emit("battle:turn_timer", {
        battleId: battle.id,
        timer: battle.turnTimer,
        currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
      });
      console.log(
        `[ARENA] Timer sync emitido para ${lobby.lobbyId}, timer=${battle.turnTimer}`
      );
    }
  }
}

async function handleTimerExpired(battle: Battle): Promise<void> {
  const io = getBattleIo();
  if (!io) return;

  const lobby = battleLobbies.get(battle.lobbyId);
  if (!lobby) return;

  const currentPlayerId = battle.actionOrder[battle.currentTurnIndex];

  const currentUnit = battle.activeUnitId
    ? battle.units.find((u) => u.id === battle.activeUnitId)
    : null;

  if (currentUnit && currentUnit.hasStartedAction) {
    if (currentUnit.conditions.includes("QUEIMANDO")) {
      currentUnit.currentHp = Math.max(0, currentUnit.currentHp - 2);
      if (currentUnit.currentHp <= 0) {
        currentUnit.isAlive = false;
      }
    }

    currentUnit.conditions = currentUnit.conditions.filter(
      (c) => c !== "DERRUBADA" && c !== "DODGING"
    );

    const maxMarks = getMaxMarksByCategory(currentUnit.category);
    currentUnit.actionMarks = Math.min(maxMarks, currentUnit.actionMarks + 1);
    currentUnit.movesLeft = 0;
    currentUnit.actionsLeft = 0;
    currentUnit.hasStartedAction = false;

    io.to(lobby.lobbyId).emit("battle:unit_turn_ended", {
      battleId: battle.id,
      unitId: currentUnit.id,
      actionMarks: currentUnit.actionMarks,
      currentHp: currentUnit.currentHp,
      isAlive: currentUnit.isAlive,
      conditions: currentUnit.conditions,
    });

    if (!currentUnit.isAlive) {
      io.to(lobby.lobbyId).emit("battle:unit_defeated", {
        battleId: battle.id,
        unitId: currentUnit.id,
      });
    }
  }

  const aliveBySide = new Map<string, number>();
  for (const u of battle.units) {
    if (u.isAlive) {
      const count = aliveBySide.get(u.ownerId) || 0;
      aliveBySide.set(u.ownerId, count + 1);
    }
  }

  console.log("[ARENA] Timer expirado - Verificando vitória:", {
    aliveBySideSize: aliveBySide.size,
    aliveBySide: Object.fromEntries(aliveBySide),
  });

  if (aliveBySide.size <= 1) {
    battle.status = "ENDED";
    stopBattleTurnTimer(battle.id);
    const winnerId = aliveBySide.keys().next().value || null;
    const winnerKingdom = battle.units.find(
      (u) => u.ownerId === winnerId
    )?.ownerKingdomId;

    io.to(lobby.lobbyId).emit("battle:battle_ended", {
      battleId: battle.id,
      winnerId,
      winnerKingdomId: winnerKingdom,
      reason:
        aliveBySide.size === 0
          ? "Empate - Todas as unidades foram derrotadas"
          : "Todas as unidades inimigas foram derrotadas",
      finalUnits: battle.units,
    });

    const loserId =
      winnerId === lobby.hostUserId ? lobby.guestUserId : lobby.hostUserId;
    await updateUserStats(winnerId, loserId, battle.isArena);

    userToLobby.delete(lobby.hostUserId);
    if (lobby.guestUserId) {
      userToLobby.delete(lobby.guestUserId);
    }

    lobby.status = "ENDED";
    await deleteBattleFromDB(battle.id);
    await deleteLobbyFromDB(lobby.lobbyId);
    console.log(
      `[ARENA] Batalha ${battle.id} finalizada via timer. Vencedor: ${winnerId}`
    );
    return;
  }

  if (currentUnit && currentUnit.hasStartedAction) {
    const currentCount = battle.roundActionsCount.get(currentPlayerId) || 0;
    battle.roundActionsCount.set(currentPlayerId, currentCount + 1);
  }

  battle.activeUnitId = undefined;
  if (battle.actionOrder.length) {
    battle.currentTurnIndex =
      (battle.currentTurnIndex + 1) % battle.actionOrder.length;
  }

  io.to(lobby.lobbyId).emit("battle:next_player", {
    battleId: battle.id,
    currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
    index: battle.currentTurnIndex,
    round: battle.round,
  });

  const allPlayersActed = battle.actionOrder.every(
    (playerId) => (battle.roundActionsCount.get(playerId) || 0) >= 1
  );

  if (allPlayersActed) {
    battle.round++;
    for (const playerId of battle.actionOrder) {
      battle.roundActionsCount.set(playerId, 0);
    }
    io.to(lobby.lobbyId).emit("battle:new_round", {
      battleId: battle.id,
      round: battle.round,
    });
    io.to(lobby.lobbyId).emit("battle:next_player", {
      battleId: battle.id,
      currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
      index: battle.currentTurnIndex,
      round: battle.round,
    });
    console.log(
      `[ARENA] Nova rodada ${battle.round} (via timer) - Re-emitido battle:next_player com round atualizado`
    );
  }

  startBattleTurnTimer(battle);
  await saveBattleToDB(battle);
}
