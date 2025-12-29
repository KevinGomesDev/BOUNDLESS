// Kingdom Types

export interface Kingdom {
  id: string;
  name: string;
  userId: string;
  alignment: string;
  race: string;
  capitalName: string;
  population: number;
  reputation: number;
  gold: number;
  createdat: string;
}

export interface KingdomState {
  kingdom: Kingdom | null;
  kingdoms: Kingdom[];
  isLoading: boolean;
  error: string | null;
}

export interface KingdomContextType {
  state: KingdomState;
  createKingdom: (data: CreateKingdomData) => Promise<Kingdom>;
  loadKingdoms: () => Promise<Kingdom[]>;
  selectKingdom: (kingdom: Kingdom | null) => void;
}

export interface CreateKingdomData {
  name: string;
  alignment: string;
  race: string;
  capitalName: string;
  regent?: RegentData;
  troops?: TroopTemplateData[];
}

export interface RegentData {
  name: string;
  class: string;
  attributes: Record<string, number>;
}

export interface TroopTemplateData {
  name: string;
  type: string;
  resource: string;
  attributes: Record<string, number>;
  passives: TroopPassive[];
}

export interface TroopPassive {
  id: string;
  name: string;
  description: string;
}

export type KingdomAction =
  | { type: "SET_KINGDOM"; payload: Kingdom | null }
  | { type: "SET_KINGDOMS"; payload: Kingdom[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
