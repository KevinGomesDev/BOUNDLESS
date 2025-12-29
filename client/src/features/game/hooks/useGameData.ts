import { useContext } from "react";
import { GameDataContext } from "../context/GameDataContext";
import type { GameDataContextType } from "../types/game-data.types";

export function useGameData(): GameDataContextType {
  const context = useContext(GameDataContext);

  if (!context) {
    throw new Error("useGameData deve ser usado dentro de GameDataProvider");
  }

  return context;
}

export function useGameDataState() {
  const { state } = useGameData();
  return state;
}

export function useTerrains() {
  const { state } = useGameData();
  return state.terrains;
}

export function useStructures() {
  const { state } = useGameData();
  return state.structures;
}
