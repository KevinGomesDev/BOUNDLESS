// shared/data/Templates/HeroesTemplates.ts
// Templates raw de todos os heróis pré-criados (recrutáveis durante partidas)

export interface HeroTemplate {
  /** Código único do herói (usado como ID) */
  code: string;
  /** Nome do herói */
  name: string;
  /** Descrição/história do herói */
  description: string;
  /** Classe do herói (deve existir em classes.data.ts) */
  classCode: string;
  /** Avatar (sprite ID) */
  avatar: string;
  /** Nível inicial */
  level: number;
  /** Atributos base */
  combat: number;
  speed: number;
  focus: number;
  armor: number;
  vitality: number;
  /** Skills iniciais (códigos de skills da classe) */
  initialSkills: string[];
  /** Spells iniciais (códigos de spells) */
  initialSpells: string[];
  /** Custo para recrutar (em recursos do reino) */
  recruitCost: {
    ore?: number;
    supplies?: number;
    arcane?: number;
    devotion?: number;
  };
  /** Ícone/emoji para exibição */
  icon: string;
  /** Cor temática (para UI) */
  themeColor: string;
}

// =============================================================================
// HERÓIS PRÉ-DEFINIDOS
// =============================================================================

export const HERO_TEMPLATES: HeroTemplate[] = [
  // =============================================================================
  // ALDRIC - GUERREIRO
  // =============================================================================
  {
    code: "ALDRIC_IRONFORGE",
    name: "Aldric Ironforge",
    description:
      "Veterano de mil batalhas, Aldric forjou sua reputação nas guerras do norte. Sua espada Quebra-Destino já atravessou armaduras que pareciam impenetráveis. Leal até a morte, ele protege aqueles que considera dignos de seu aço.",
    classCode: "WARRIOR",
    avatar: "warrior_aldric",
    level: 1,
    combat: 6,
    speed: 3,
    focus: 1,
    armor: 4,
    vitality: 6,
    initialSkills: ["EXTRA_ATTACK"],
    initialSpells: [],
    recruitCost: {
      ore: 8,
      supplies: 4,
    },
    icon: "⚔️",
    themeColor: "#dc2626", // red-600
  },

  // =============================================================================
  // ELARA - CLÉRIGA
  // =============================================================================
  {
    code: "ELARA_DAWNBRINGER",
    name: "Elara Dawnbringer",
    description:
      "Escolhida da Deusa da Aurora, Elara abandonou uma vida de nobreza para seguir o chamado divino. Sua fé é tão inabalável quanto sua habilidade de curar feridas mortais. Onde ela pisa, as sombras recuam.",
    classCode: "CLERIC",
    avatar: "cleric_elara",
    level: 1,
    combat: 2,
    speed: 3,
    focus: 5,
    armor: 3,
    vitality: 7,
    initialSkills: ["HEAL"],
    initialSpells: [],
    recruitCost: {
      devotion: 10,
      supplies: 2,
    },
    icon: "✝️",
    themeColor: "#eab308", // yellow-500
  },

  // =============================================================================
  // VAREN - MAGO
  // =============================================================================
  {
    code: "VAREN_STORMWEAVER",
    name: "Varen Stormweaver",
    description:
      "Expulso da Academia Arcana por experimentos proibidos, Varen dominou magias que outros temem pronunciar. Trovões obedecem seu comando e relâmpagos dançam entre seus dedos. Seu conhecimento é vasto, mas seu temperamento, imprevisível.",
    classCode: "WIZARD",
    avatar: "wizard_varen",
    level: 1,
    combat: 1,
    speed: 3,
    focus: 8,
    armor: 1,
    vitality: 7,
    initialSkills: ["GRIMOIRE"],
    initialSpells: ["FIRE"],
    recruitCost: {
      arcane: 12,
    },
    icon: "🔮",
    themeColor: "#7c3aed", // violet-600
  },
];
