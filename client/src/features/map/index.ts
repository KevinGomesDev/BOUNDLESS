// Map Feature - Public API
export { MapProvider, MapContext } from "./context/MapContext";
export {
  useMap,
  useMapState,
  useTerritories,
  useSelectedTerritory,
} from "./hooks/useMap";
export { MapCanvas, TopHUD, RightSidebar, TerritoryModal } from "./components";
export type {
  Territory,
  TerrainName,
  MapState,
  MapContextType,
  MapAction,
} from "./types/map.types";
export type { TerritoryArea, AvailableStructure } from "./components";
