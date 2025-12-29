// Game Data Feature - Public API
export { GameDataProvider, GameDataContext } from "./context/GameDataContext";
export {
  useGameData,
  useGameDataState,
  useTerrains,
  useStructures,
} from "./hooks/useGameData";
export type {
  TerrainType,
  StructureInfo,
  GameDataState,
  GameDataContextType,
  GameDataAction,
} from "./types/game-data.types";
