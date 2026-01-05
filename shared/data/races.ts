// shared/data/races.ts
// Definições de raças do jogo
// Re-exporta templates e fornece funções utilitárias

// Re-exportar tipos e templates
export type { RaceDefinition } from "./Templates/RacesTemplates";
export { RACE_DEFINITIONS } from "./Templates/RacesTemplates";

import {
  RACE_DEFINITIONS,
  type RaceDefinition,
} from "./Templates/RacesTemplates";

/**
 * Obtém uma raça pelo ID
 */
export function getRaceById(id: string): RaceDefinition | undefined {
  return RACE_DEFINITIONS.find((r) => r.id === id);
}

/**
 * Obtém todas as raças
 */
export function getAllRaces(): RaceDefinition[] {
  return RACE_DEFINITIONS;
}

/**
 * Obtém o ID da condição passiva de uma raça
 */
export function getRacePassiveCondition(raceId: string): string | undefined {
  const race = getRaceById(raceId);
  return race?.passiveConditionId;
}
