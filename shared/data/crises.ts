// shared/data/crises.ts
import type { CrisisType } from "../types/match.types";

// Interface auxiliar apenas para este arquivo
interface CrisisDefinition {
  type: CrisisType;
  stats: {
    combat: number;
    speed: number;
    focus: number;
    armor: number;
    vitality: number;
    maxVitality: number;
  };
  initialExtraData: {
    [key: string]: any;
  };
}

export const CRISIS_DEFINITIONS: Record<CrisisType, CrisisDefinition> = {
  KAIJU: {
    type: "KAIJU",
    stats: {
      combat: 10,
      speed: 20,
      focus: 15,
      armor: 25,
      vitality: 30,
      maxVitality: 30,
    },
    initialExtraData: {
      kaijuDamageStack: 0, // Começa com 0 de bônus acumulado
    },
  },
  WALKERS: {
    type: "WALKERS",
    stats: {
      combat: 10,
      speed: 10,
      focus: 10,
      armor: 10,
      vitality: 10,
      maxVitality: 10,
    },
    initialExtraData: {
      walkerUnitCount: 5, // Começa contando como 5 unidades
    },
  },

  AMORPHOUS: {
    type: "AMORPHOUS",
    stats: {
      combat: 10,
      speed: 10,
      focus: 10,
      armor: 50,
      vitality: 50,
      maxVitality: 50,
    },
    initialExtraData: {
      amorphousRegen: 2, // Regenera 2 por turno
    },
  },
};
