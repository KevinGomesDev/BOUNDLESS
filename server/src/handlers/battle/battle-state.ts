import { Server } from "socket.io";
import type { Battle, BattleLobby } from "./battle-types";

export const battleLobbies: Map<string, BattleLobby> = new Map();
export const activeBattles: Map<string, Battle> = new Map();
export const userToLobby: Map<string, string> = new Map();
export const socketToUser: Map<string, string> = new Map();
export const disconnectedPlayers: Map<string, string> = new Map();
export const rematchRequests: Map<string, Set<string>> = new Map();
export const rematchLocks: Map<string, boolean> = new Map();
export const battleTimerIntervals: Map<
  string,
  ReturnType<typeof setInterval>
> = new Map();
export const battleDiceModalPaused: Map<string, boolean> = new Map();

let ioRef: Server | null = null;

export function setBattleIo(io: Server): void {
  ioRef = io;
}

export function getBattleIo(): Server | null {
  return ioRef;
}
