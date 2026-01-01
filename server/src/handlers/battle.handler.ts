// src/handlers/battle.handler.ts
// Orquestrador enxuto: delega para módulos battle/* já componentizados
import { Server, Socket } from "socket.io";
import {
  activeBattles,
  battleLobbies,
  disconnectedPlayers,
  setBattleIo,
  socketToUser,
  userToLobby,
} from "./battle/battle-state";
import { registerBattleLobbyHandlers } from "./battle/battle-handlers-lobby";
import { registerBattleActionHandlers } from "./battle/battle-handlers-actions";
import { registerBattleRematchHandlers } from "./battle/battle-handlers-rematch";
import { registerBattleDisconnectHandler } from "./battle/battle-handlers-disconnect";
import { bootstrapArenaPersistence } from "./battle/battle-persistence";
import {
  pauseBattleTimerIfNoPlayers,
  resumeBattleTimer,
} from "./battle/battle-timer";

bootstrapArenaPersistence().catch((err) =>
  console.error("[ARENA] Erro ao inicializar estado da batalha:", err)
);

export {
  battleLobbies,
  activeBattles,
  battleLobbies as arenaLobbies,
  activeBattles as arenaBattles,
  userToLobby,
  disconnectedPlayers,
  socketToUser,
  pauseBattleTimerIfNoPlayers,
  resumeBattleTimer,
};

export const registerBattleHandlers = (io: Server, socket: Socket): void => {
  setBattleIo(io);
  registerBattleLobbyHandlers(io, socket);
  registerBattleActionHandlers(io, socket);
  registerBattleRematchHandlers(io, socket);
  registerBattleDisconnectHandler(io, socket);
};
