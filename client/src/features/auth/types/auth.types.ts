// Auth Types

export interface User {
  id: string;
  username: string;
  email?: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType {
  state: AuthState;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<User>;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
}

export type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
