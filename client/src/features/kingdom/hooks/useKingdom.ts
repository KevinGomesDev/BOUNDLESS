import { useContext } from "react";
import { KingdomContext } from "../context/KingdomContext";

export function useKingdom() {
  const context = useContext(KingdomContext);

  if (!context) {
    throw new Error("useKingdom deve ser usado dentro de KingdomProvider");
  }

  // Retorna uma API mais amigável
  return {
    // Métodos
    createKingdom: context.createKingdom,
    loadKingdoms: context.loadKingdoms,
    selectKingdom: context.selectKingdom,
    // Estado
    kingdoms: context.state.kingdoms,
    currentKingdom: context.state.kingdom,
    isLoading: context.state.isLoading,
    error: context.state.error,
    // Acesso ao state completo
    state: context.state,
  };
}

export function useKingdomState() {
  const { state } = useKingdom();
  return state;
}

export function useKingdoms() {
  const { state } = useKingdom();
  return state.kingdoms;
}

export function useCurrentKingdom() {
  const { state } = useKingdom();
  return state.kingdom;
}
