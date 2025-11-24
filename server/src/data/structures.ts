// src/data/structures.ts
import { ResourceType } from "../types";

interface StructureDefinition {
  id: string;
  name: string;
  maxHp: number;
  resourceGenerated?: ResourceType; // Qual recurso ela produz
  specialEffect?: string;
}

export const STRUCTURE_DEFINITIONS: Record<string, StructureDefinition> = {
  CITADEL: {
    id: "CITADEL",
    name: "Cidadela",
    maxHp: 100,
    specialEffect: "O coração do seu reino. Se cair, você perde.",
  },
  SAWMILL: {
    // Exemplo para recurso mecânico/minério se fosse o caso
    id: "MINE",
    name: "Mina",
    maxHp: 30,
    resourceGenerated: "MINERIO",
  },
  FARM: {
    id: "FARM",
    name: "Fazenda",
    maxHp: 20,
    resourceGenerated: "COMIDA",
  },
  FORTRESS: {
    // <--- A nova estrutura
    id: "FORTRESS",
    name: "Fortaleza",
    maxHp: 80,
    specialEffect: "Unidades aliadas neste território recebem +2 de Armadura.",
  },
  SHRINE: {
    id: "SHRINE",
    name: "Santuário",
    maxHp: 25,
    resourceGenerated: "DEVOCAO",
  },
  LIBRARY: {
    id: "LIBRARY",
    name: "Biblioteca Arcana",
    maxHp: 20,
    resourceGenerated: "ARCANA",
  },
  ARENA: {
    id: "ARENA",
    name: "Fosso de Combate",
    maxHp: 40,
    resourceGenerated: "EXPERIENCIA",
  },
};
