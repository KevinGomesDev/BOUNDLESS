import { useContext } from "react";
import { GameContext } from "../context/GameContext";
import type { GameContextType } from "../types/game.types";

/**
 * Hook para acessar o contexto do jogo
 */
export function useGame(): GameContextType {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error("useGame deve ser usado dentro de GameProvider");
  }

  return context;
}

/**
 * Hook para acessar apenas o estado do jogo
 */
export function useGameState() {
  const { state } = useGame();
  return state;
}

/**
 * Hook para acessar métodos de autenticação
 */
export function useAuth() {
  const game = useGame();
  return {
    register: game.register,
    login: game.login,
    logout: game.logout,
    user: game.state.user,
    isAuthenticated: game.state.isAuthenticated,
    isLoading: game.state.isAuthLoading,
    error: game.state.authError,
  };
}

/**
 * Hook para acessar métodos de reino
 */
export function useKingdom() {
  const game = useGame();
  return {
    createKingdom: game.createKingdom,
    loadKingdoms: game.loadKingdoms,
    kingdom: game.state.kingdom,
    kingdoms: game.state.kingdoms,
    isLoading: game.state.isKingdomLoading,
    error: game.state.kingdomError,
  };
}

/**
 * Hook para acessar métodos de partida
 */
export function useMatch() {
  const game = useGame();
  return {
    startMatch: game.startMatch,
    loadMatch: game.loadMatch,
    currentMatch: game.state.currentMatch,
    isLoading: game.state.isMatchLoading,
    error: game.state.matchError,
  };
}

/**
 * Hook para acessar métodos do mapa
 */
export function useMap() {
  const game = useGame();
  return {
    loadMapData: game.loadMapData,
    mapData: game.state.mapData,
    isLoading: game.state.isMapLoading,
  };
}

/**
 * Hook para acessar status de conexão
 */
export function useConnection() {
  const game = useGame();
  return {
    connect: game.connect,
    disconnect: game.disconnect,
    isConnected: game.state.isConnected,
    error: game.state.connectionError,
  };
}
