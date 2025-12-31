// Arena Configuration - Single source of truth for arena GRID/MAP visual settings
// This is sent to clients to ensure consistent rendering

import { getConditionColorsMap } from "../logic/conditions";

export const ARENA_CONFIG = {
  grid: {
    width: 10,
    height: 5,
  },
  colors: {
    // Grid/Mapa
    gridBackground: "#1a1a2e",
    gridLine: "#16213e",
    gridDot: "#0f3460",
    cellLight: "#2d2d44",
    cellDark: "#1f1f33",
    cellHover: "#3d3d5c",
    cellMovable: "#2a4a2a",
    cellAttackable: "#4a2a2a",
    // Spawn areas
    hostPrimary: "#4a90d9",
    hostSecondary: "#2d5a8a",
    guestPrimary: "#d94a4a",
    guestSecondary: "#8a2d2d",
  },
  // Cores das condições (importadas do arquivo de condições)
  conditionColors: getConditionColorsMap(),
};

export type ArenaConfig = typeof ARENA_CONFIG;
