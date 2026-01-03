// src/data/units.ts
// Configurações de recrutamento, level up e limites de unidades (Regente, Herói, Tropas)

// --- REGENTE ---
export const REGENT_LEVELUP_BASE_COST = 6; // Começa em 6
export const REGENT_LEVELUP_INCREMENT = 3; // Incrementa 3 por nível
export const REGENT_INITIAL_ATTRIBUTE_POINTS = 30;
export const REGENT_ATTRIBUTE_POINTS_PER_LEVEL = 6;

// --- HERÓI ---
export const HERO_LEVELUP_BASE_COST = 4; // Começa em 4
export const HERO_LEVELUP_INCREMENT = 2; // Incrementa 2 por nível
export const HERO_INITIAL_ATTRIBUTE_POINTS = 15;
export const HERO_ATTRIBUTE_POINTS_PER_LEVEL = 4;

// Custos de recrutamento de Herói (baseado na quantidade de heróis que já tem)
export const HERO_RECRUITMENT_COSTS: Record<number, number> = {
  0: 4, // Primeiro herói
  1: 6, // Segundo herói
  2: 8, // Terceiro herói
  3: 10, // Quarto herói
  4: 12, // Quinto herói
  5: 14, // Sexto herói
};

export const MAX_HEROES_PER_PLAYER = 6;
export const MAX_HERO_LEVEL = 10;

// --- TROPAS ---
// Custos de recrutamento de Tropas (baseado na quantidade de tropas da mesma categoria)
// Fórmula: (quantidade_atual + 1) × 2
export const TROOP_RECRUITMENT_BASE_COST = 2;

// Custos de Level Up de Categoria de Tropa (Nível 1→2: 2, 2→3: 3, etc.)
export const TROOP_LEVELUP_COSTS: Record<number, number> = {
  1: 2, // Nível 1 → 2
  2: 3, // Nível 2 → 3
  3: 4, // Nível 3 → 4
  4: 5, // Nível 4 → 5
  5: 6, // Nível 5 → 6
  6: 7, // Nível 6 → 7
  7: 8, // Nível 7 → 8
  8: 9, // Nível 8 → 9
  9: 10, // Nível 9 → 10
};

export const MAX_TROOP_LEVEL = 10;
export const TROOP_ATTRIBUTE_POINTS_PER_LEVEL = 2;
