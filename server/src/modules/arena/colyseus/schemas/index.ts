// server/src/modules/arena/colyseus/schemas/index.ts
// Barrel exports dos schemas de arena

export * from "./arena.schema";
export * from "./battle-unit.schema";

// Re-export schemas comuns usados nas rooms
export {
  BattleObstacleSchema,
  ArenaConfigSchema,
  BattleMapConfigSchema,
  BattleLogEntry,
  PlayerResources,
} from "../../../../colyseus/schemas/common.schema";
