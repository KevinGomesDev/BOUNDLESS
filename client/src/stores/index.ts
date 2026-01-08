// client/src/stores/index.ts
// Barrel export para todas as stores Zustand

export { useAuthStore } from "./authStore";
export { useColyseusStore } from "./colyseusStore";
export { useSessionStore } from "./sessionStore";
export { useKingdomStore } from "./kingdomStore";
export { useArenaStore } from "./arenaStore";
export type { ArenaBattleComputed } from "./arenaStore";
export { useMatchStore } from "./matchStore";
export { useMapStore } from "./mapStore";
export { useGameDataStore } from "./gameDataStore";
export { useChatStore } from "./chatStore";
export { useEventStore } from "./eventStore";
export type { EventToastData } from "./eventStore";
export { StoreInitializer } from "./StoreInitializer";
export { useAudioStore } from "./audio.store";
