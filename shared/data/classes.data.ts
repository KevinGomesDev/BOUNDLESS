// shared/data/classes.data.ts
// Definições estáticas de todas as classes do jogo
// FONTE DE VERDADE para classes de heróis/regentes
// Re-exporta templates e fornece funções utilitárias

import type { HeroClassDefinition } from "../types/skills.types";

// Re-exportar classes do template
export { HERO_CLASSES } from "./Templates/ClassesTemplates";

import { HERO_CLASSES } from "./Templates/ClassesTemplates";

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Busca uma classe pelo código
 */
export function getClassByCode(code: string): HeroClassDefinition | undefined {
  return HERO_CLASSES.find((c) => c.code === code);
}

/**
 * Busca uma skill pelo código (em qualquer classe)
 */
export function getSkillByCode(
  code: string
): { skill: HeroClassDefinition["skills"][0]; classCode: string } | undefined {
  for (const heroClass of HERO_CLASSES) {
    const skill = heroClass.skills.find((s) => s.code === code);
    if (skill) {
      return { skill, classCode: heroClass.code };
    }
  }
  return undefined;
}

/**
 * Lista todas as skills de uma classe
 */
export function getSkillsForClass(
  classCode: string
): HeroClassDefinition["skills"] {
  const heroClass = getClassByCode(classCode);
  return heroClass?.skills || [];
}

/**
 * Retorna resumo de todas as classes para listagem
 */
export function getAllClassesSummary(): Array<{
  code: string;
  name: string;
  description: string;
  archetype: string;
  resourceUsed: string;
  skillCount: number;
}> {
  return HERO_CLASSES.map((c) => ({
    code: c.code,
    name: c.name,
    description: c.description,
    archetype: c.archetype,
    resourceUsed: c.resourceUsed,
    skillCount: c.skills.length,
  }));
}
