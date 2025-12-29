import React, { createContext, useReducer, useCallback } from "react";
import type {
  MapState,
  MapContextType,
  MapAction,
  Territory,
} from "../types/map.types";
import type { MatchMapData } from "../../match/types/match.types";
import { socketService } from "../../../services/socket.service";

const initialState: MapState = {
  territories: [],
  selectedTerritory: null,
  isLoading: false,
  error: null,
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case "SET_TERRITORIES":
      return { ...state, territories: action.payload };
    case "SET_SELECTED":
      return { ...state, selectedTerritory: action.payload };
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

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  const requestMapData = useCallback(
    async (matchId?: string): Promise<Territory[]> => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        socketService.emit("match:request_map", { matchId });

        const mapData = await new Promise<MatchMapData>((resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout>;

          const successHandler = (data: MatchMapData) => {
            clearTimeout(timeoutId);
            socketService.off("match:map_data", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: { message: string }) => {
            clearTimeout(timeoutId);
            socketService.off("match:map_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message || "Erro ao carregar mapa"));
          };

          socketService.on("match:map_data", successHandler);
          socketService.on("error", errorHandler);

          timeoutId = setTimeout(() => {
            socketService.off("match:map_data", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error("Timeout ao carregar mapa"));
          }, 10000);
        });

        dispatch({ type: "SET_TERRITORIES", payload: mapData.territories });
        dispatch({ type: "SET_LOADING", payload: false });
        return mapData.territories;
      } catch (error: any) {
        dispatch({ type: "SET_ERROR", payload: error?.message });
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    []
  );

  const selectTerritory = useCallback((territory: Territory | null) => {
    dispatch({ type: "SET_SELECTED", payload: territory });
  }, []);

  const loadMapData = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      socketService.emit("map:load");

      const mapData = await new Promise<{ territories: Territory[] }>(
        (resolve, reject) => {
          const successHandler = (data: { territories: Territory[] }) => {
            socketService.off("map:loaded", successHandler);
            socketService.off("error", errorHandler);
            resolve(data);
          };

          const errorHandler = (data: { message: string }) => {
            socketService.off("map:loaded", successHandler);
            socketService.off("error", errorHandler);
            reject(new Error(data.message));
          };

          socketService.on("map:loaded", successHandler);
          socketService.on("error", errorHandler);

          setTimeout(
            () => reject(new Error("Timeout ao carregar mapa")),
            10000
          );
        }
      );

      dispatch({ type: "SET_TERRITORIES", payload: mapData.territories || [] });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (error: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  const contextValue: MapContextType = {
    state,
    requestMapData,
    selectTerritory,
    loadMapData,
  };

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  );
}
