// Game Data Types (Terrains, Structures, etc.)

export interface TerrainType {
  id: string;
  name: string;
  color: string;
  movementCost: number;
  defenseBonus: number;
}

export interface StructureInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  maxHp: number;
  resourceGenerated?: { type: string; amount: number };
  specialEffect?: string;
}

export interface GameDataState {
  terrains: Record<string, TerrainType>;
  structures: StructureInfo[];
  isLoading: boolean;
  error: string | null;
}

export interface GameDataContextType {
  state: GameDataState;
  loadTerrains: () => Promise<Record<string, TerrainType>>;
  loadStructures: () => Promise<StructureInfo[]>;
}

export type GameDataAction =
  | { type: "SET_TERRAINS"; payload: Record<string, TerrainType> }
  | { type: "SET_STRUCTURES"; payload: StructureInfo[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
