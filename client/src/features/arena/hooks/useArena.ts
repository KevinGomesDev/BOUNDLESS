// client/src/features/arena/hooks/useArena.ts
// Hook para Arena usando Zustand store

import { useEffect } from "react";
import { useArenaStore, useAuthStore } from "../../../stores";

export function useArena() {
  const store = useArenaStore();
  const userId = useAuthStore((state) => state.user?.id);

  // Listeners são inicializados pelo StoreInitializer - não duplicar aqui

  // Recompute battle when relevant state changes
  useEffect(() => {
    store.computeBattle(userId);
  }, [
    userId,
    store.units.length,
    store.players.length,
    store.winnerId,
    store.rematchRequests.length,
  ]);

  return {
    state: {
      lobbyId: store.lobbyId,
      isHost: store.isHost,
      lobbies: store.lobbies,
      battleId: store.battleId,
      isInBattle: store.isInBattle,
      status: store.status,
      round: store.round,
      turnTimer: store.turnTimer,
      gridWidth: store.gridWidth,
      gridHeight: store.gridHeight,
      players: store.players,
      units: store.units,
      activeUnitId: store.activeUnitId,
      selectedUnitId: store.selectedUnitId,
      currentPlayerId: store.currentPlayerId,
      unitLocked: store.unitLocked,
      actionOrder: store.actionOrder,
      obstacles: store.obstacles,
      winnerId: store.winnerId,
      winReason: store.winReason,
      rematchRequests: store.rematchRequests,
      isLoading: store.isLoading,
      error: store.error,
      battle: store.battle,
      battleResult: store.battleResult,
      rematchPending: store.rematchPending,
      opponentWantsRematch: store.opponentWantsRematch,
    },

    // Lobby listing
    listLobbies: store.listLobbies,

    // Lobby
    createLobby: store.createLobby,
    joinLobby: store.joinLobby,
    leaveLobby: store.leaveLobby,
    setReady: store.setReady,
    startBattle: store.startBattle,

    // Battle
    selectUnit: store.selectUnit,
    beginAction: store.beginAction,
    moveUnit: store.moveUnit,
    attackUnit: store.attackUnit,
    endAction: store.endAction,
    executeAction: store.executeAction,
    castSpell: store.castSpell,
    surrender: store.surrender,
    requestRematch: store.requestRematch,

    // Utilities
    getUnit: store.getUnit,
    getMyUnits: () => store.getMyUnits(userId || ""),
    clearError: store.clearError,
    dismissBattleResult: store.dismissBattleResult,
  };
}

// Alias for compatibility
export { useArena as useArenaColyseus };

export function useArenaOptional() {
  const store = useArenaStore();
  return store;
}

export function useArenaState() {
  const store = useArenaStore();
  return {
    lobbyId: store.lobbyId,
    isHost: store.isHost,
    lobbies: store.lobbies,
    battleId: store.battleId,
    isInBattle: store.isInBattle,
    status: store.status,
    round: store.round,
    turnTimer: store.turnTimer,
    gridWidth: store.gridWidth,
    gridHeight: store.gridHeight,
    players: store.players,
    units: store.units,
    activeUnitId: store.activeUnitId,
    selectedUnitId: store.selectedUnitId,
    currentPlayerId: store.currentPlayerId,
    unitLocked: store.unitLocked,
    actionOrder: store.actionOrder,
    obstacles: store.obstacles,
    winnerId: store.winnerId,
    winReason: store.winReason,
    rematchRequests: store.rematchRequests,
    isLoading: store.isLoading,
    error: store.error,
    battle: store.battle,
    battleResult: store.battleResult,
    rematchPending: store.rematchPending,
    opponentWantsRematch: store.opponentWantsRematch,
  };
}

export function useArenaLobby() {
  const store = useArenaStore();
  return {
    lobbyId: store.lobbyId,
    isHost: store.isHost,
    isInLobby: store.lobbyId !== null,
    leaveLobby: store.leaveLobby,
    startBattle: store.startBattle,
  };
}

export function useArenaBattle() {
  const store = useArenaStore();
  return {
    status: store.status,
    units: store.units,
    selectedUnitId: store.selectedUnitId,
    unitLocked: store.unitLocked,
    isInBattle: store.status === "ACTIVE",
    selectUnit: store.selectUnit,
    beginAction: store.beginAction,
    moveUnit: store.moveUnit,
    attackUnit: store.attackUnit,
    endAction: store.endAction,
    executeAction: store.executeAction,
    castSpell: store.castSpell,
    surrender: store.surrender,
  };
}
