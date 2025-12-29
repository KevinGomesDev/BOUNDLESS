// Match Types

import type { Territory } from "../../map/types/map.types";

export interface Match {
  id: string;
  status: MatchStatus;
  startDate: string;
  turnCount: number;
  maxPlayers: number;
}

export type MatchStatus = "WAITING" | "PREPARATION" | "ACTIVE" | "FINISHED";

export type TurnType =
  | "ADMINISTRACAO"
  | "EXERCITOS"
  | "MOVIMENTACAO"
  | "CRISE"
  | "ACAO"
  | "BATALHA";

export interface OpenMatch {
  id: string;
  hostName: string;
  kingdomName: string;
  createdAt: Date;
}

export interface PlayerResources {
  ore: number;
  supplies: number;
  arcane: number;
  experience: number;
  devotion: number;
}

export interface MatchPlayer {
  id: string;
  userId: string;
  username: string;
  playerIndex: number;
  playerColor: string;
  kingdomName: string;
  capitalTerritoryId: string | null;
  isReady: boolean;
  resources: PlayerResources;
  hasFinishedCurrentTurn: boolean;
}

// Novo tipo para o estado completo recebido do servidor
export interface CompleteMatchState {
  matchId: string;
  status: MatchStatus;
  currentRound: number;
  currentTurn: TurnType;
  activePlayerIds: string[];
  players: MatchPlayer[];
  crisisState: object | null;
  updatedAt: Date;
}

export interface MatchMapData {
  territories: Territory[];
  players: MatchPlayer[];
  status: MatchStatus;
}

export interface PreparationData {
  playerId: string;
  playerIndex: number;
  playerColor: string;
  kingdomName: string;
  capital: Territory | null;
  isReady: boolean;
  freeBuildingsRemaining: number;
}

export interface MatchState {
  currentMatch: Match | null;
  openMatches: OpenMatch[];
  preparationData: PreparationData | null;
  matchMapData: MatchMapData | null;
  completeMatchState: CompleteMatchState | null; // Novo: estado completo do servidor
  myPlayerId: string | null; // ID do MatchPlayer local
  isMyTurn: boolean; // Se é minha vez de agir
  waitingForPlayers: string[]; // Nomes dos jogadores esperando
  isLoading: boolean;
  error: string | null;
}

export interface MatchContextType {
  state: MatchState;
  listOpenMatches: () => Promise<OpenMatch[]>;
  createMatch: (kingdomId: string) => Promise<{ matchId: string }>;
  joinMatch: (matchId: string, kingdomId: string) => Promise<void>;
  getPreparationData: (matchId: string) => Promise<PreparationData>;
  requestMapData: (matchId?: string) => Promise<MatchMapData>;
  requestMatchState: (matchId: string) => Promise<void>; // Novo: sincronizar estado
  setPlayerReady: (matchId: string) => Promise<void>;
  finishTurn: (matchId: string, playerId: string) => Promise<void>; // Novo: terminar turno
  startMatch: (playerIds: string[]) => Promise<void>;
  loadMatch: (matchId: string) => Promise<void>;
  setMatchMapData: (data: MatchMapData | null) => void;
  setPreparationData: (data: PreparationData | null) => void;
}

export type MatchAction =
  | { type: "SET_MATCH"; payload: Match | null }
  | { type: "SET_OPEN_MATCHES"; payload: OpenMatch[] }
  | { type: "SET_PREPARATION_DATA"; payload: PreparationData | null }
  | { type: "SET_MATCH_MAP_DATA"; payload: MatchMapData | null }
  | { type: "SET_COMPLETE_MATCH_STATE"; payload: CompleteMatchState | null }
  | { type: "SET_MY_PLAYER_ID"; payload: string | null }
  | { type: "SET_IS_MY_TURN"; payload: boolean }
  | { type: "SET_WAITING_FOR_PLAYERS"; payload: string[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
