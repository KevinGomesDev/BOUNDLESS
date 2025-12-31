import React, { createContext, useReducer, useCallback } from "react";
import type {
  AuthState,
  AuthContextType,
  AuthAction,
  User,
} from "../types/auth.types";
import { socketService } from "../../../services/socket.service";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
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

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string
    ): Promise<User> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const user = await socketService.waitForResponse<User>(
          "auth:register",
          { username, email, password },
          "auth:success",
          "auth:error",
          10000
        );

        // Save token to localStorage
        if (user.token) {
          localStorage.setItem("auth_token", user.token);
        }
        localStorage.setItem("auth_user", JSON.stringify(user));

        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SET_LOADING", payload: false });

        return user;
      } catch (error: any) {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Erro ao registrar",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    []
  );

  const login = useCallback(
    async (username: string, password: string): Promise<User> => {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const user = await socketService.waitForResponse<User>(
          "auth:login",
          { username, password },
          "auth:success",
          "auth:error",
          10000
        );

        if (user.token) {
          localStorage.setItem("auth_token", user.token);
        }
        localStorage.setItem("auth_user", JSON.stringify(user));

        dispatch({ type: "SET_USER", payload: user });
        dispatch({ type: "SET_LOADING", payload: false });

        return user;
      } catch (error: any) {
        dispatch({
          type: "SET_ERROR",
          payload: error?.message || "Erro ao fazer login",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    socketService.emit("auth:logout");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    dispatch({ type: "RESET" });
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const savedUser = localStorage.getItem("auth_user");
      const savedToken = localStorage.getItem("auth_token");

      if (!savedUser || !savedToken) {
        return false;
      }

      try {
        const verifiedUser = await socketService.waitForResponse<User>(
          "auth:verify",
          { token: savedToken },
          "auth:verified",
          "auth:error",
          5000
        );

        // Atualiza o token se o servidor enviou um novo (refresh)
        if (verifiedUser.token) {
          localStorage.setItem("auth_token", verifiedUser.token);
        }
        localStorage.setItem("auth_user", JSON.stringify(verifiedUser));

        dispatch({ type: "SET_USER", payload: verifiedUser });
        return true;
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        return false;
      }
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      return false;
    }
  }, []);

  const contextValue: AuthContextType = {
    state,
    register,
    login,
    logout,
    restoreSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
