// src/types/items.ts
export type AttributeKey = "combat" | "acuity" | "focus" | "armor" | "vitality";

export type ItemRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface GeneratedItem {
  id: string;
  name: string;
  type: string; // e.g., Sword, Bow, Tome, Cloak, Amulet
  description: string;
  rarity: ItemRarity;
  magical: boolean;
  boost: { attribute: AttributeKey; amount: number };
}
