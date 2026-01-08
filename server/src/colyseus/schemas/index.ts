// server/src/colyseus/schemas/index.ts
// Export de todos os schemas

// Common
export * from "./common.schema";

// Battle Unit
export * from "../../modules/arena/colyseus/schemas/battle-unit.schema";

// Arena (Lobby + Battle)
export * from "../../modules/arena/colyseus/schemas/arena.schema";

// Match (Strategic Map)
export * from "../../modules/match/colyseus/schemas/match.schema";
