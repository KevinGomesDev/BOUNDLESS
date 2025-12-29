// Kingdom Creation Types - Local to components

export interface Race {
  id: string;
  name: string;
  description: string;
  passiveName: string;
  passiveEffect: string;
  color: number;
}

export interface Alignment {
  id: string;
  name: string;
  description: string;
  passiveName: string;
  passiveEffect: string;
  color: number;
}

export interface GameClass {
  id: string;
  name: string;
  archetype: string;
  resourceUsed: string;
  description: string;
  skills: any[];
}

export interface TroopPassive {
  id: string;
  name: string;
  description: string;
}

export interface TroopTemplate {
  slotIndex: number;
  name: string;
  passiveId: string;
  resourceType: "ore" | "supplies" | "arcane" | "experience" | "devotion";
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

export interface KingdomFormData {
  name: string;
  capitalName: string;
  alignment: string;
  race: string;
  raceMetadata: any;
}

export interface RegentFormData {
  name: string;
  class: string;
  attributeDistribution: {
    combat: number;
    acuity: number;
    focus: number;
    armor: number;
    vitality: number;
  };
  initialFeature?: string;
}
