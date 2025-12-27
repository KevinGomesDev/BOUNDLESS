import React, {
  createContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { GameContextType, GameState, Kingdom } from "../types/game.types";
import { socketService } from "../services/socket.service";

const initialState: GameState = {
  // Auth
  user: null,
  isAuthenticated: false,
  isAuthLoading: false,
  authError: null,

  // Kingdom
  kingdom: null,
  kingdoms: [],
  isKingdomLoading: false,
  kingdomError: null,

  // Match
  currentMatch: null,
  isMatchLoading: false,
  matchError: null,

  // Map
  mapData: null,
  isMapLoading: false,

  // Connection
  isConnected: false,
  connectionError: null,
};

type GameAction =
  | { type: "SET_USER"; payload: any }
  | { type: "SET_AUTH_LOADING"; payload: boolean }
  | { type: "SET_AUTH_ERROR"; payload: string | null }
  | { type: "SET_KINGDOM"; payload: Kingdom | null }
  | { type: "SET_KINGDOMS"; payload: Kingdom[] }
  | { type: "SET_KINGDOM_LOADING"; payload: boolean }
  | { type: "SET_KINGDOM_ERROR"; payload: string | null }
  | { type: "SET_MATCH"; payload: any }
  | { type: "SET_MATCH_LOADING"; payload: boolean }
  | { type: "SET_MATCH_ERROR"; payload: string | null }
  | { type: "SET_MAP_DATA"; payload: any }
  | { type: "SET_MAP_LOADING"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_CONNECTION_ERROR"; payload: string | null }
  | { type: "RESET" };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case "SET_AUTH_LOADING":
      return { ...state, isAuthLoading: action.payload };

    case "SET_AUTH_ERROR":
      return { ...state, authError: action.payload };

    case "SET_KINGDOM":
      return { ...state, kingdom: action.payload };

    case "SET_KINGDOMS":
      return { ...state, kingdoms: action.payload };

    case "SET_KINGDOM_LOADING":
      return { ...state, isKingdomLoading: action.payload };

    case "SET_KINGDOM_ERROR":
      return { ...state, kingdomError: action.payload };

    case "SET_MATCH":
      return { ...state, currentMatch: action.payload };

    case "SET_MATCH_LOADING":
      return { ...state, isMatchLoading: action.payload };

    case "SET_MATCH_ERROR":
      return { ...state, matchError: action.payload };

    case "SET_MAP_DATA":
      return { ...state, mapData: action.payload };

    case "SET_MAP_LOADING":
      return { ...state, isMapLoading: action.payload };

    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };

    case "SET_CONNECTION_ERROR":
      return { ...state, connectionError: action.payload };

    case "RESET":
      return { ...initialState, isConnected: state.isConnected };

    default:
      return state;
  }
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined
);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // --- Connection Management ---
  const connect = useCallback(async (url: string = "http://localhost:3000") => {
    try {
      await socketService.connect(url);
      dispatch({ type: "SET_CONNECTED", payload: true });
      dispatch({ type: "SET_CONNECTION_ERROR", payload: null });

      // Registra listeners globais
      setupSocketListeners(dispatch);
    } catch (error: any) {
      const errorMessage = error?.message || "Falha ao conectar ao servidor";
      dispatch({ type: "SET_CONNECTION_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    dispatch({ type: "SET_CONNECTED", payload: false });
    dispatch({ type: "RESET" });
  }, []);

  // --- Auth Methods ---
  const register = useCallback(
    async (username: string, email: string, password: string) => {
      dispatch({ type: "SET_AUTH_LOADING", payload: true });
      dispatch({ type: "SET_AUTH_ERROR", payload: null });

      try {
        socketService.emit("auth:register", { username, email, password });

        // Aguarda resposta
        const user = await new Promise<any>((resolve, reject) => {
          const successHandler = (data: any) => {
            socketService.off("auth:success", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: any) => {
            socketService.off("auth:success", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message));
          };

          socketService.on("auth:success", successHandler);
          socketService.on("error", errorHandler);

          // Timeout de 10 segundos
          setTimeout(() => reject(new Error("Timeout na autenticação")), 10000);
        });

        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SET_AUTH_LOADING", payload: false });
      } catch (error: any) {
        const errorMessage = error?.message || "Erro ao registrar";
        dispatch({ type: "SET_AUTH_ERROR", payload: errorMessage });
        dispatch({ type: "SET_AUTH_LOADING", payload: false });
        throw error;
      }
    },
    []
  );

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: "SET_AUTH_LOADING", payload: true });
    dispatch({ type: "SET_AUTH_ERROR", payload: null });

    try {
      socketService.emit("auth:login", { username, password });

      const user = await new Promise<any>((resolve, reject) => {
        const successHandler = (data: any) => {
          socketService.off("auth:success", successHandler);
          socketService.off("error", errorHandler);
          resolve(data);
        };

        const errorHandler = (data: any) => {
          socketService.off("auth:success", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error(data.message));
        };

        socketService.on("auth:success", successHandler);
        socketService.on("error", errorHandler);

        setTimeout(() => reject(new Error("Timeout na autenticação")), 10000);
      });

      dispatch({ type: "SET_USER", payload: user });
      dispatch({ type: "SET_AUTH_LOADING", payload: false });
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao fazer login";
      dispatch({ type: "SET_AUTH_ERROR", payload: errorMessage });
      dispatch({ type: "SET_AUTH_LOADING", payload: false });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    socketService.emit("auth:logout");
    dispatch({ type: "RESET" });
  }, []);

  // --- Kingdom Methods ---
  const createKingdom = useCallback(
    async (data: any) => {
      dispatch({ type: "SET_KINGDOM_LOADING", payload: true });
      dispatch({ type: "SET_KINGDOM_ERROR", payload: null });

      try {
        socketService.emit("kingdom:create", {
          userId: state.user?.id,
          ...data,
        });

        const kingdom = await new Promise<Kingdom>((resolve, reject) => {
          const successHandler = (data: any) => {
            socketService.off("kingdom:created", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: any) => {
            socketService.off("kingdom:created", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message));
          };

          socketService.on("kingdom:created", successHandler);
          socketService.on("error", errorHandler);

          setTimeout(() => reject(new Error("Timeout ao criar reino")), 10000);
        });

        dispatch({ type: "SET_KINGDOM", payload: kingdom });
        dispatch({ type: "SET_KINGDOM_LOADING", payload: false });
      } catch (error: any) {
        const errorMessage = error?.message || "Erro ao criar reino";
        dispatch({ type: "SET_KINGDOM_ERROR", payload: errorMessage });
        dispatch({ type: "SET_KINGDOM_LOADING", payload: false });
        throw error;
      }
    },
    [state.user?.id]
  );

  const loadKingdoms = useCallback(async () => {
    dispatch({ type: "SET_KINGDOM_LOADING", payload: true });

    try {
      socketService.emit("kingdom:list");

      const kingdoms = await new Promise<Kingdom[]>((resolve, reject) => {
        const successHandler = (data: any) => {
          socketService.off("kingdom:list", successHandler);
          socketService.off("error", errorHandler);
          resolve(data.kingdoms || []);
        };

        const errorHandler = (data: any) => {
          socketService.off("kingdom:list", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error(data.message));
        };

        socketService.on("kingdom:list", successHandler);
        socketService.on("error", errorHandler);

        setTimeout(
          () => reject(new Error("Timeout ao carregar reinos")),
          10000
        );
      });

      dispatch({ type: "SET_KINGDOMS", payload: kingdoms });
      dispatch({ type: "SET_KINGDOM_LOADING", payload: false });
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao carregar reinos";
      dispatch({ type: "SET_KINGDOM_ERROR", payload: errorMessage });
      dispatch({ type: "SET_KINGDOM_LOADING", payload: false });
      throw error;
    }
  }, []);

  // --- Match Methods ---
  const startMatch = useCallback(
    async (playerIds: string[]) => {
      dispatch({ type: "SET_MATCH_LOADING", payload: true });

      try {
        socketService.emit("match:start", {
          players: playerIds.map((id) => ({
            userId: id,
            kingdomId: state.kingdom?.id,
          })),
        });

        const match = await new Promise<any>((resolve, reject) => {
          const successHandler = (data: any) => {
            socketService.off("match:started", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: any) => {
            socketService.off("match:started", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message));
          };

          socketService.on("match:started", successHandler);
          socketService.on("error", errorHandler);

          setTimeout(
            () => reject(new Error("Timeout ao iniciar partida")),
            10000
          );
        });

        dispatch({ type: "SET_MATCH", payload: match });
        dispatch({ type: "SET_MATCH_LOADING", payload: false });
      } catch (error: any) {
        const errorMessage = error?.message || "Erro ao iniciar partida";
        dispatch({ type: "SET_MATCH_ERROR", payload: errorMessage });
        dispatch({ type: "SET_MATCH_LOADING", payload: false });
        throw error;
      }
    },
    [state.kingdom?.id]
  );

  const loadMatch = useCallback(async (matchId: string) => {
    dispatch({ type: "SET_MATCH_LOADING", payload: true });

    try {
      socketService.emit("match:load", { matchId });

      const match = await new Promise<any>((resolve, reject) => {
        const successHandler = (data: any) => {
          socketService.off("match:loaded", successHandler);
          socketService.off("error", errorHandler);
          resolve(data);
        };

        const errorHandler = (data: any) => {
          socketService.off("match:loaded", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error(data.message));
        };

        socketService.on("match:loaded", successHandler);
        socketService.on("error", errorHandler);

        setTimeout(
          () => reject(new Error("Timeout ao carregar partida")),
          10000
        );
      });

      dispatch({ type: "SET_MATCH", payload: match });
      dispatch({ type: "SET_MATCH_LOADING", payload: false });
    } catch (error: any) {
      const errorMessage = error?.message || "Erro ao carregar partida";
      dispatch({ type: "SET_MATCH_ERROR", payload: errorMessage });
      dispatch({ type: "SET_MATCH_LOADING", payload: false });
      throw error;
    }
  }, []);

  // --- Map Methods ---
  const loadMapData = useCallback(async () => {
    dispatch({ type: "SET_MAP_LOADING", payload: true });

    try {
      socketService.emit("map:load");

      const mapData = await new Promise<any>((resolve, reject) => {
        const successHandler = (data: any) => {
          socketService.off("map:loaded", successHandler);
          socketService.off("error", errorHandler);
          resolve(data);
        };

        const errorHandler = (data: any) => {
          socketService.off("map:loaded", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error(data.message));
        };

        socketService.on("map:loaded", successHandler);
        socketService.on("error", errorHandler);

        setTimeout(() => reject(new Error("Timeout ao carregar mapa")), 10000);
      });

      dispatch({ type: "SET_MAP_DATA", payload: mapData });
      dispatch({ type: "SET_MAP_LOADING", payload: false });
    } catch (error: any) {
      dispatch({ type: "SET_MAP_LOADING", payload: false });
      throw error;
    }
  }, []);

  // Setup initial connection listeners
  useEffect(() => {
    const handleDisconnect = () => {
      dispatch({ type: "SET_CONNECTED", payload: false });
    };

    socketService.on("socket:disconnected", handleDisconnect);

    return () => {
      socketService.off("socket:disconnected", handleDisconnect);
    };
  }, []);

  const contextValue: GameContextType = {
    state,
    register,
    login,
    logout,
    createKingdom,
    loadKingdoms,
    startMatch,
    loadMatch,
    loadMapData,
    connect,
    disconnect,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}

/**
 * Configura os listeners de socket globais
 */
function setupSocketListeners(dispatch: React.Dispatch<any>) {
  // Listeners para eventos gerais do servidor
  socketService.on("socket:connected", (data: any) => {
    console.log("[Game] Conectado ao servidor:", data.socketId);
  });

  socketService.on("socket:error", (data: any) => {
    console.error("[Game] Erro de socket:", data.error);
    dispatch({ type: "SET_CONNECTION_ERROR", payload: data.error?.message });
  });
}
