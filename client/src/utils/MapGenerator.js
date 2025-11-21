import { Delaunay } from "d3-delaunay";
import { BiomeGenerator } from "./BiomeGenerator";
import { TERRAIN_TYPES } from "../../../shared/constants";

export class MapGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.MAP_SIZE = 25; // Quantidade alvo de territórios de terra
    this.MIN_TERRITORY_DIST = 100; // Distância mínima entre centros (evita territórios muito pequenos)

    this.delaunay = null;
    this.voronoi = null;
    this.points = [];
    this.territoryData = [];
    this.numLandTerritories = 0;

    this.biomeGenerator = new BiomeGenerator(width, height);
  }

  generate() {
    this.biomeGenerator.generateBioSeeds(10);

    const landPoints = [];
    const waterPoints = [];

    const marginX = this.width * 0.2;
    const marginY = this.height * 0.2;

    const bounds = {
      minX: marginX,
      maxX: this.width - marginX,
      minY: marginY,
      maxY: this.height - marginY,
    };

    let attempts = 0;
    const maxAttempts = 2000;

    while (landPoints.length < this.MAP_SIZE && attempts < maxAttempts) {
      attempts++;

      const x = Math.random() * (bounds.maxX - bounds.minX) + bounds.minX;
      const y = Math.random() * (bounds.maxY - bounds.minY) + bounds.minY;

      let tooClose = false;
      for (const p of landPoints) {
        const dist = Math.sqrt(Math.pow(p[0] - x, 2) + Math.pow(p[1] - y, 2));
        if (dist < this.MIN_TERRITORY_DIST) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        landPoints.push([x, y]);
      }
    }

    this.numLandTerritories = landPoints.length;

    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const dx = bounds.minX + (i * (bounds.maxX - bounds.minX)) / steps;
      waterPoints.push([dx, bounds.minY - 40]);
      waterPoints.push([dx, bounds.maxY + 40]);
    }
    for (let i = 0; i <= steps; i++) {
      const dy = bounds.minY + (i * (bounds.maxY - bounds.minY)) / steps;
      waterPoints.push([bounds.minX - 40, dy]);
      waterPoints.push([bounds.maxX + 40, dy]);
    }

    const extraWater = 40;
    for (let i = 0; i < extraWater; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      if (
        x < bounds.minX ||
        x > bounds.maxX ||
        y < bounds.minY ||
        y > bounds.maxY
      ) {
        waterPoints.push([x, y]);
      }
    }

    this.points = [...landPoints, ...waterPoints];
    this.delaunay = Delaunay.from(this.points);
    this.voronoi = this.delaunay.voronoi([0, 0, this.width, this.height]);

    this.assignTerrainTypes();
  }

  assignTerrainTypes() {
    this.territoryData = this.points.map((point, index) => {
      if (index >= this.numLandTerritories) {
        return {
          id: index,
          type: "WATER",
          terrain: TERRAIN_TYPES.OCEAN,
        };
      }

      const [x, y] = point;
      const terrain = this.biomeGenerator.getBiomeForPoint(x, y);

      return {
        id: index,
        type: "LAND",
        terrain: terrain,
      };
    });
  }

  getTerritoryIdAt(x, y) {
    return this.delaunay.find(x, y);
  }

  getPolygon(index) {
    return this.voronoi.cellPolygon(index);
  }
}
