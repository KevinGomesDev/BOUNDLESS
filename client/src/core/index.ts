// Core - Public API
export {
  ConnectionProvider,
  ConnectionContext,
} from "./context/ConnectionContext";
export {
  useConnection,
  useConnectionState,
  useIsConnected,
} from "./hooks/useConnection";
export type {
  ConnectionState,
  ConnectionContextType,
  ConnectionAction,
} from "./types/connection.types";

// Session Management
export { SessionProvider, SessionContext } from "./context/SessionContext";
export type { SessionContextType } from "./context/SessionContext";
export { useSession } from "./hooks/useSession";
export { useSessionGuard } from "./hooks/useSessionGuard";
export type { SessionGuardResult } from "./hooks/useSessionGuard";

// Re-export shared session types for convenience
export type {
  SessionState,
  SessionAction,
  SessionType,
  ActiveSessionFrontend,
  SessionGuardState,
} from "../../../shared/types/session.types";
