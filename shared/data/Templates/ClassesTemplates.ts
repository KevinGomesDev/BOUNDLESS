// shared/data/Templates/ClassesTemplates.ts
// Templates raw de todas as classes do jogo

import type { HeroClassDefinition } from "../../types/skills.types";
import {
  WARRIOR_SKILLS,
  CLERIC_SKILLS,
  WIZARD_SKILLS,
  SUMMONER_SKILLS,
} from "./SkillsTemplates";

// =============================================================================
// CLASSES
// =============================================================================

export const HERO_CLASSES: HeroClassDefinition[] = [
  // =============================================================================
  // GUERREIRO - FÍSICO (FOOD)
  // =============================================================================
  {
    code: "WARRIOR",
    name: "Guerreiro",
    description:
      "Soldado disciplinado e experiente. Mestre em ataques múltiplos e em recuperação tática.",
    archetype: "PHYSICAL",
    resourceUsed: "FOOD",
    skills: WARRIOR_SKILLS,
  },

  // =============================================================================
  // CLÉRIGO - ESPIRITUAL (DEVOTION)
  // =============================================================================
  {
    code: "CLERIC",
    name: "Clérigo",
    description:
      "Escolhido divino com poderes sagrados. Protege aliados e expele maldições.",
    archetype: "SPIRITUAL",
    resourceUsed: "DEVOTION",
    skills: CLERIC_SKILLS,
  },

  // =============================================================================
  // MAGO - ARCANO (ARCANA)
  // =============================================================================
  {
    code: "WIZARD",
    name: "Mago",
    description:
      "Estudioso das artes arcanas que manipula a realidade através de feitiços poderosos.",
    archetype: "ARCANE",
    resourceUsed: "ARCANA",
    skills: WIZARD_SKILLS,
  },

  // =============================================================================
  // INVOCADOR - ESPIRITUAL (DEVOTION)
  // =============================================================================
  {
    code: "SUMMONER",
    name: "Invocador",
    description:
      "Mestre espiritual que canaliza seu poder através de um Eidolon - uma manifestação espiritual que cresce ao consumir as almas de seus inimigos.",
    archetype: "SPIRITUAL",
    resourceUsed: "DEVOTION",
    skills: SUMMONER_SKILLS,
  },
];
