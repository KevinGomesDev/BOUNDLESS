import { TERRAIN_TYPES } from "../../../shared/constants";

export class BiomeGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.biomeCenters = [];
  }

  // Gera "Sementes" de biomas espalhadas pelo mapa
  generateBioSeeds(count = 8) {
    this.biomeCenters = [];

    // Definimos as margens onde os biomas podem nascer (área jogável)
    const marginX = this.width * 0.2;
    const marginY = this.height * 0.2;
    const areaW = this.width - marginX * 2;
    const areaH = this.height - marginY * 2;

    for (let i = 0; i < count; i++) {
      const x = marginX + Math.random() * areaW;
      const y = marginY + Math.random() * areaH;

      // Define o tipo da semente baseada na latitude, MAS agora é definitivo para a região
      const type = this.getBiomeTypeByLatitude(y);

      this.biomeCenters.push({ x, y, type });
    }
  }

  getBiomeTypeByLatitude(y) {
    const mapTop = this.height * 0.2;
    const mapBottom = this.height * 0.8;
    const mapHeight = mapBottom - mapTop;
    let pct = (y - mapTop) / mapHeight;

    // Forçamos um pouco a barra para garantir extremos
    if (pct < 0.25) return TERRAIN_TYPES.ICE;
    if (pct < 0.35) return TERRAIN_TYPES.MOUNTAIN;
    if (pct < 0.65)
      return Math.random() > 0.5 ? TERRAIN_TYPES.FOREST : TERRAIN_TYPES.PLAINS;
    if (pct < 0.8) return TERRAIN_TYPES.WASTELAND;
    return TERRAIN_TYPES.DESERT;
  }

  // Para cada território, encontramos qual o Centro de Bioma mais próximo
  getBiomeForPoint(x, y) {
    let closestSeed = null;
    let minDist = Infinity;

    for (const seed of this.biomeCenters) {
      const dist = Phaser.Math.Distance.Between(x, y, seed.x, seed.y);

      // Adiciona um pouco de "ruído" na distância para bordas irregulares
      // Se não tiver ruído, as divisões de bioma ficam retas demais
      const noise = Math.random() * 50 - 25;

      if (dist + noise < minDist) {
        minDist = dist;
        closestSeed = seed;
      }
    }

    return closestSeed ? closestSeed.type : TERRAIN_TYPES.PLAINS;
  }
}
