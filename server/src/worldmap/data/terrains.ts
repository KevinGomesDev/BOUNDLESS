// server/src/worldmap/data/terrains.ts

export interface TerrainType {
  color: number;
  name: string;
}

export const TERRAIN_TYPES: Record<string, TerrainType> = {
  ICE: { color: 0xdbe7ff, name: "Gelo" },
  MOUNTAIN: { color: 0x778da9, name: "Montanha" },
  FOREST: { color: 0x2d6a4f, name: "Floresta" },
  PLAINS: { color: 0x95d5b2, name: "Planície" },
  WASTELAND: { color: 0x6c584c, name: "Terra Devastada" },
  DESERT: { color: 0xe9c46a, name: "Deserto" },
  OCEAN: { color: 0x457b9d, name: "Mar Aberto" },
};
