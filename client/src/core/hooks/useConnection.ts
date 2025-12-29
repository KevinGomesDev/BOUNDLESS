import { useContext } from "react";
import { ConnectionContext } from "../context/ConnectionContext";

export function useConnection() {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error(
      "useConnection deve ser usado dentro de ConnectionProvider"
    );
  }

  // Retorna uma API mais amigável
  return {
    // Métodos
    connect: context.connect,
    disconnect: context.disconnect,
    // Estado
    isConnected: context.state.isConnected,
    isReconnecting: context.state.isReconnecting,
    reconnectAttempt: context.state.reconnectAttempt,
    error: context.state.error,
    // Acesso ao state completo
    state: context.state,
  };
}

export function useConnectionState() {
  const { state } = useConnection();
  return state;
}

export function useIsConnected() {
  const { state } = useConnection();
  return state.isConnected;
}
