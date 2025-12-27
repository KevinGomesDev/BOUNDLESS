// Game State Types

export interface User {
  id: string;
  username: string;
  email?: string;
}

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

export interface Match {
  id: string;
  status: "WAITING" | "ACTIVE" | "FINISHED";
  startDate: string;
  turnCount: number;
  maxPlayers: number;
}

export interface GameState {
  // Autenticação
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;

  // Reino
  kingdom: Kingdom | null;
  kingdoms: Kingdom[];
  isKingdomLoading: boolean;
  kingdomError: string | null;

  // Partida
  currentMatch: Match | null;
  isMatchLoading: boolean;
  matchError: string | null;

  // Mapa
  mapData: any;
  isMapLoading: boolean;

  // Conexão
  isConnected: boolean;
  connectionError: string | null;
}

export interface GameContextType {
  state: GameState;
  // Auth
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;

  // Kingdom
  createKingdom: (data: any) => Promise<void>;
  loadKingdoms: () => Promise<void>;

  // Match
  startMatch: (playerIds: string[]) => Promise<void>;
  loadMatch: (matchId: string) => Promise<void>;

  // Map
  loadMapData: () => Promise<void>;

  // Connection
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
}

export interface AuthMessage {
  type: "register" | "login";
  data: {
    username?: string;
    email?: string;
    password: string;
  };
}

export interface ErrorResponse {
  message: string;
}

export interface SuccessResponse<T = any> {
  data: T;
}
