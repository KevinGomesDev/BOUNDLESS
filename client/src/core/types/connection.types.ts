// Connection Types

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  error: string | null;
}

export interface ConnectionContextType {
  state: ConnectionState;
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
}

export type ConnectionAction =
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "SET_RECONNECTING"; payload: boolean }
  | { type: "SET_RECONNECT_ATTEMPT"; payload: number }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
