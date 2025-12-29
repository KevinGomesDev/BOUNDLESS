import React, { createContext, useReducer, useCallback } from "react";
import type {
  GameDataState,
  GameDataContextType,
  GameDataAction,
  TerrainType,
  StructureInfo,
} from "../types/game-data.types";
import { socketService } from "../../../services/socket.service";

const initialState: GameDataState = {
  terrains: {},
  structures: [],
  isLoading: false,
  error: null,
};

function gameDataReducer(
  state: GameDataState,
  action: GameDataAction
): GameDataState {
  switch (action.type) {
    case "SET_TERRAINS":
      return { ...state, terrains: action.payload };
    case "SET_STRUCTURES":
      return { ...state, structures: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export const GameDataContext = createContext<GameDataContextType | undefined>(
  undefined
);

export function GameDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameDataReducer, initialState);

  const loadTerrains = useCallback(async (): Promise<
    Record<string, TerrainType>
  > => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      socketService.emit("game:get_terrains");

      const terrains = await new Promise<Record<string, TerrainType>>(
        (resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout>;

          const successHandler = (data: Record<string, TerrainType>) => {
            clearTimeout(timeoutId);
            socketService.off("game:terrains_data", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: { message: string }) => {
            clearTimeout(timeoutId);
            socketService.off("game:terrains_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message || "Erro ao carregar terrenos"));
          };

          socketService.on("game:terrains_data", successHandler);
          socketService.on("error", errorHandler);

          timeoutId = setTimeout(() => {
            socketService.off("game:terrains_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error("Timeout ao carregar terrenos"));
          }, 10000);
        }
      );

      dispatch({ type: "SET_TERRAINS", payload: terrains });
      dispatch({ type: "SET_LOADING", payload: false });
      return terrains;
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error?.message });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  const loadStructures = useCallback(async (): Promise<StructureInfo[]> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      socketService.emit("game:get_structures", {});

      const structures = await new Promise<StructureInfo[]>(
        (resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout>;

          const successHandler = (
            data: StructureInfo[] | { structures: StructureInfo[] }
          ) => {
            clearTimeout(timeoutId);
            socketService.off("game:structures_data", successHandler);
            socketService.off("error", errorHandler);
            resolve(Array.isArray(data) ? data : data.structures || []);
          };

          const errorHandler = (data: { message: string }) => {
            clearTimeout(timeoutId);
            socketService.off("game:structures_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message || "Erro ao carregar estruturas"));
          };

          socketService.on("game:structures_data", successHandler);
          socketService.on("error", errorHandler);

          timeoutId = setTimeout(() => {
            socketService.off("game:structures_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error("Timeout ao carregar estruturas"));
          }, 10000);
        }
      );

      dispatch({ type: "SET_STRUCTURES", payload: structures });
      dispatch({ type: "SET_LOADING", payload: false });
      return structures;
    } catch (error: any) {
      dispatch({ type: "SET_ERROR", payload: error?.message });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  const contextValue: GameDataContextType = {
    state,
    loadTerrains,
    loadStructures,
  };

  return (
    <GameDataContext.Provider value={contextValue}>
      {children}
    </GameDataContext.Provider>
  );
}
