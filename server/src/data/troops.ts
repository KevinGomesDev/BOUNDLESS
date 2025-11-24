// src/data/troops.ts
import { UnitCategory, ResourceType, UnitStats } from "../types";

export interface TroopDefinition {
  id: string; // ID da Categoria (DEFENSOR, EMBOSCADOR...)
  name: string;
  resourceUsed: ResourceType; // Qual CR gasta para recrutar
  baseStats: UnitStats;
  passiveDescription: string;
}

export const TROOP_DEFINITIONS: Record<string, TroopDefinition> = {
  DEFENSOR: {
    id: "DEFENSOR",
    name: "Defensor",
    resourceUsed: "MINERIO",
    baseStats: {
      combat: 1,
      acuity: 2,
      focus: 1,
      armor: 2,
      vitality: 4,
    },
    passiveDescription: "Transfere dano de aliados adjacentes para si.",
  },
  EMBOSCADOR: {
    id: "EMBOSCADOR",
    name: "Emboscador",
    resourceUsed: "COMIDA", // Suprimento
    baseStats: {
      combat: 2,
      acuity: 4,
      focus: 2,
      armor: 1,
      vitality: 1,
    },
    passiveDescription: "Dobro de dano na Proteção. +1D por cada 2 Acuidade.",
  },
  ATACANTE: {
    id: "ATACANTE",
    name: "Atacante",
    resourceUsed: "EXPERIENCIA",
    baseStats: {
      combat: 4,
      acuity: 2,
      focus: 1,
      armor: 1,
      vitality: 2,
    },
    passiveDescription: "Rolagens de 1 não anulam Sucessos no ataque.",
  },
  CONJURADOR: {
    id: "CONJURADOR",
    name: "Conjurador",
    resourceUsed: "ARCANA",
    baseStats: {
      combat: 2,
      acuity: 2,
      focus: 4,
      armor: 1,
      vitality: 1,
    },
    passiveDescription: "Pode usar a Magia escolhida na criação do Reino.",
  },
};
