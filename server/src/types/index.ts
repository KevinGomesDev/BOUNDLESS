// src/types/index.ts
import { Alignment, Race } from "@prisma/client";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface CreateKingdomData {
  userId: string;
  name: string;
  capitalName: string;
  alignment: Alignment;
  race: Race;
  raceMetadata?: string;
  crestUrl?: string;
  capitalImageUrl?: string;
}

// Tipos de Crise
export type CrisisType = "KAIJU" | "WALKERS" | "AMORPHOUS";

export interface CrisisState {
  type: CrisisType;
  isActive: boolean; // Se já apareceu no mapa
  revealedSpecials: number[]; // Lista de indices [1, 3] dos especiais descobertos pelos jogadores

  // Dados Vitais (Muda conforme o tipo)
  stats: {
    combat: number;
    acuity: number;
    focus: number;
    armor: number;
    vitality: number;
    maxVitality: number;
  };

  // Posição (Se for Kaiju/Amorfa é um numero, se for Walkers pode ser nulo pois são unidades)
  locationIndex?: number;

  // Regras Específicas salvas aqui
  extraData: {
    walkerUnitCount?: number; // Para a crise 2
    amorphousRegen?: number; // Para a crise 3
    kaijuDamageStack?: number; // Para a crise 1 (Dano recebido = +Combate)
  };

  // Territórios que revelam segredos (Sorteados no inicio)
  intelTerritoryIndices: number[];
}

export interface StartMatchData {
  players: {
    userId: string;
    kingdomId: string;
  }[];
}

export enum UnitCategory {
  TROPA = "TROPA",
  HEROI = "HEROI",
  REGENTE = "REGENTE",
  PRISIONEIRO = "PRISIONEIRO",
}

export interface UnitStats {
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

// Interface para o "Molde" de uma unidade (o que fica no arquivo estático)
export interface UnitDefinition {
  id: string; // ex: "ARCHER"
  name: string;
  category: UnitCategory;
  baseStats: UnitStats;
  moveRange: number; // Quantos quadrados anda
  passive?: string; // Descrição ou ID da passiva
}

// --- RECURSOS ---
export type ResourceType =
  | "MINERIO"
  | "ARCANA"
  | "COMIDA"
  | "EXPERIENCIA"
  | "DEVOCAO";

// --- CLASSES ---
export type ClassArchetype =
  | "MAGICA"
  | "MECANICA"
  | "FISICA"
  | "ESPIRITUAL"
  | "CAOTICA";

export interface ClassDefinition {
  id: string; // "WARRIOR"
  name: string; // "Guerreiro"
  archetype: ClassArchetype;
  resourceUsed: ResourceType; // Define qual recurso essa classe gasta
  skills: SkillDefinition[];
}

// --- HABILIDADES ---
export type SkillCategory = "ATIVA" | "REATIVA" | "PASSIVA";
export type SkillCostTier = "BAIXO" | "MEDIO" | "ALTO"; // 1, 2, 3
export type RangeType = "ADJACENTE" | "BAIXO" | "MEDIO" | "ALTO"; // 1, 2, 4, 6

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;

  // Apenas para Ativas e Reativas
  costTier?: SkillCostTier;
  range?: RangeType;
}

// Helper para traduzir Tier em Número
export const COST_VALUES: Record<SkillCostTier, number> = {
  BAIXO: 1,
  MEDIO: 2,
  ALTO: 3,
};

export const RANGE_VALUES: Record<RangeType, number> = {
  ADJACENTE: 1,
  BAIXO: 2,
  MEDIO: 4,
  ALTO: 6,
};
