import React, { createContext, useReducer, useCallback } from "react";
import type {
  KingdomState,
  KingdomContextType,
  KingdomAction,
  Kingdom,
  CreateKingdomData,
} from "../types/kingdom.types";
import { socketService } from "../../../services/socket.service";

const initialState: KingdomState = {
  kingdom: null,
  kingdoms: [],
  isLoading: false,
  error: null,
};

function kingdomReducer(
  state: KingdomState,
  action: KingdomAction
): KingdomState {
  switch (action.type) {
    case "SET_KINGDOM":
      return { ...state, kingdom: action.payload };
    case "SET_KINGDOMS":
      return { ...state, kingdoms: action.payload };
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

export const KingdomContext = createContext<KingdomContextType | undefined>(
  undefined
);

export function KingdomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(kingdomReducer, initialState);

  const createKingdom = useCallback(
    async (data: CreateKingdomData): Promise<Kingdom> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        socketService.emit("kingdom:create", data);

        const kingdom = await new Promise<Kingdom>((resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout>;

          const successHandler = (kingdomData: Kingdom) => {
            clearTimeout(timeoutId);
            socketService.off("kingdom:created", successHandler);
            socketService.off("error", errorHandler);
            resolve(kingdomData);
          };

          const errorHandler = (error: { message: string }) => {
            clearTimeout(timeoutId);
            socketService.off("kingdom:created", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(error.message || "Erro ao criar reino"));
          };

          socketService.on("kingdom:created", successHandler);
          socketService.on("error", errorHandler);

          timeoutId = setTimeout(() => {
            socketService.off("kingdom:created", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error("Timeout ao criar reino"));
          }, 10000);
        });

        dispatch({ type: "SET_KINGDOM", payload: kingdom });
        dispatch({ type: "SET_LOADING", payload: false });
        return kingdom;
      } catch (error: any) {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Erro ao criar reino",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    []
  );

  const loadKingdoms = useCallback(async (): Promise<Kingdom[]> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      socketService.emit("kingdom:list");

      const kingdoms = await new Promise<Kingdom[]>((resolve, reject) => {
        let resolved = false;

        const cleanup = () => {
          socketService.off("kingdom:list_success", successHandler);
          socketService.off("error", errorHandler);
          clearTimeout(timeoutId);
        };

        const successHandler = (data: Kingdom[] | { kingdoms: Kingdom[] }) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          resolve(Array.isArray(data) ? data : data.kingdoms || []);
        };

        const errorHandler = (data: { message: string }) => {
          if (resolved) return;
          resolved = true;
          cleanup();
          reject(new Error(data.message));
        };

        socketService.on("kingdom:list_success", successHandler);
        socketService.on("error", errorHandler);

        const timeoutId = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          cleanup();
          reject(new Error("Timeout ao carregar reinos"));
        }, 10000);
      });

      dispatch({ type: "SET_KINGDOMS", payload: kingdoms });
      dispatch({ type: "SET_LOADING", payload: false });
      return kingdoms;
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error?.message || "Erro ao carregar reinos",
      });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  const selectKingdom = useCallback((kingdom: Kingdom | null) => {
    dispatch({ type: "SET_KINGDOM", payload: kingdom });
  }, []);

  const contextValue: KingdomContextType = {
    state,
    createKingdom,
    loadKingdoms,
    selectKingdom,
  };

  return (
    <KingdomContext.Provider value={contextValue}>
      {children}
    </KingdomContext.Provider>
  );
}
