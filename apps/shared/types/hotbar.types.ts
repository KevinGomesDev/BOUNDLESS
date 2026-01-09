// shared/types/hotbar.types.ts
// Tipos para barra de atalhos de abilities

/**
 * Slot de ability na hotbar
 * null = slot vazio
 */
export type HotbarSlot = string | null;

/**
 * Configuração da hotbar de uma unidade
 * Cada array tem 9 posições (índices 0-8, correspondendo a teclas 1-9)
 */
export interface UnitHotbarConfig {
  /** Barra principal (1-9) */
  primary: [
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot
  ];
  /** Barra secundária (Shift+1-9) */
  secondary: [
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot,
    HotbarSlot
  ];
}

/**
 * Cria uma hotbar vazia com 9 slots null em cada barra
 */
export function createEmptyHotbar(): UnitHotbarConfig {
  return {
    primary: [null, null, null, null, null, null, null, null, null],
    secondary: [null, null, null, null, null, null, null, null, null],
  };
}

/**
 * Cria uma hotbar com abilities auto-distribuídas
 * @param features - Lista de feature codes (ações comuns + skills)
 * @param spells - Lista de spell codes
 */
export function createDefaultHotbar(
  features: string[],
  spells: string[]
): UnitHotbarConfig {
  const hotbar = createEmptyHotbar();

  // Distribui features na barra primária
  features.slice(0, 9).forEach((code, index) => {
    hotbar.primary[index] = code;
  });

  // Se sobrarem features, ou tiver spells, usa barra secundária
  const remainingFeatures = features.slice(9);
  const allSecondary = [...remainingFeatures, ...spells];

  allSecondary.slice(0, 9).forEach((code, index) => {
    hotbar.secondary[index] = code;
  });

  return hotbar;
}

/**
 * Verifica se a barra secundária tem algum slot preenchido
 */
export function hasSecondarySlots(hotbar: UnitHotbarConfig): boolean {
  return hotbar.secondary.some((slot) => slot !== null);
}
