import { useContext } from "react";
import { MatchContext } from "../context/MatchContext";

export function useMatch() {
  const context = useContext(MatchContext);

  if (!context) {
    throw new Error("useMatch deve ser usado dentro de MatchProvider");
  }

  // Retorna uma API mais amigável
  return {
    // Métodos
    listOpenMatches: context.listOpenMatches,
    createMatch: context.createMatch,
    joinMatch: context.joinMatch,
    getPreparationData: context.getPreparationData,
    requestMapData: context.requestMapData,
    requestMatchState: context.requestMatchState,
    setPlayerReady: context.setPlayerReady,
    finishTurn: context.finishTurn,
    startMatch: context.startMatch,
    loadMatch: context.loadMatch,
    // Estado
    currentMatch: context.state.currentMatch,
    openMatches: context.state.openMatches,
    preparationData: context.state.preparationData,
    matchMapData: context.state.matchMapData,
    completeMatchState: context.state.completeMatchState,
    myPlayerId: context.state.myPlayerId,
    isMyTurn: context.state.isMyTurn,
    waitingForPlayers: context.state.waitingForPlayers,
    isLoading: context.state.isLoading,
    error: context.state.error,
    // Acesso ao state completo
    state: context.state,
  };
}

export function useMatchState() {
  const { state } = useMatch();
  return state;
}

export function useCurrentMatch() {
  const { state } = useMatch();
  return state.currentMatch;
}

export function useOpenMatches() {
  const { state } = useMatch();
  return state.openMatches;
}

export function usePreparationData() {
  const { state } = useMatch();
  return state.preparationData;
}

export function useMatchMapData() {
  const { state } = useMatch();
  return state.matchMapData;
}
