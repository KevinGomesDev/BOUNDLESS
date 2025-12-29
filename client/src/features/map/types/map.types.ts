// Map Types

export interface Territory {
  id: string;
  matchId: string;
  mapIndex: number;
  centerX: number;
  centerY: number;
  type: "LAND" | "WATER";
  terrainType: TerrainName;
  polygonData: string;
  size: "SMALL" | "MEDIUM" | "LARGE";
  areaSlots: number;
  usedSlots: number;
  ownerId: string | null;
  isCapital: boolean;
  hasCrisisIntel: boolean;
  constructionCount: number;
  fortressCount: number;
  isDisabled: boolean;
  // Legacy fields
  name?: string;
  structures?: any[];
  units?: any[];
  resources?: Record<string, number>;
}

export type TerrainName =
  | "ICE"
  | "MOUNTAIN"
  | "FOREST"
  | "PLAINS"
  | "WASTELAND"
  | "DESERT"
  | "OCEAN";

export interface MapState {
  territories: Territory[];
  selectedTerritory: Territory | null;
  isLoading: boolean;
  error: string | null;
}

export interface MapContextType {
  state: MapState;
  requestMapData: (matchId?: string) => Promise<Territory[]>;
  selectTerritory: (territory: Territory | null) => void;
  loadMapData: () => Promise<void>;
}

export type MapAction =
  | { type: "SET_TERRITORIES"; payload: Territory[] }
  | { type: "SET_SELECTED"; payload: Territory | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
