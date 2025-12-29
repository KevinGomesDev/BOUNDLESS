import { useContext } from "react";
import { MapContext } from "../context/MapContext";
import type { MapContextType } from "../types/map.types";

export function useMap(): MapContextType {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMap deve ser usado dentro de MapProvider");
  }

  return context;
}

export function useMapState() {
  const { state } = useMap();
  return state;
}

export function useTerritories() {
  const { state } = useMap();
  return state.territories;
}

export function useSelectedTerritory() {
  const { state } = useMap();
  return state.selectedTerritory;
}
