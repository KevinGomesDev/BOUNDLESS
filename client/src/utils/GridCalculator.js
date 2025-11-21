import Phaser from "phaser";

export class GridCalculator {
  /**
   * Calcula a área de um polígono baseada nos seus pontos (Shoelace Formula)
   */
  static calculatePolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }

  static normalizePolygon(rawPoly, screenW, screenH) {
    // 1. Bounding Box Original
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    // rawPoly é array de arrays [[x,y], [x,y]] vindo do MapGenerator
    rawPoly.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });

    const polyW = maxX - minX;
    const polyH = maxY - minY;

    // 2. Escala (70% da tela)
    const scaleX = (screenW * 0.7) / Math.max(1, polyW);
    const scaleY = (screenH * 0.7) / Math.max(1, polyH);
    const scale = Math.min(scaleX, scaleY);

    // 3. Centraliza pontos em relação ao (0,0)
    const points = rawPoly.map(([x, y]) => {
      return {
        x: (x - (minX + polyW / 2)) * scale,
        y: (y - (minY + polyH / 2)) * scale,
      };
    });

    return {
      points,
      phaserPoly: new Phaser.Geom.Polygon(points),
      scale,
    };
  }

  static generateRectangularGrid(
    cols,
    rows,
    screenW,
    screenH,
    fixedRadius = null
  ) {
    const MARGIN_TOP = 100;

    let radius = fixedRadius;

    // Se NÃO tiver raio fixo, calcula para caber na tela (Lógica antiga)
    if (!radius) {
      const availW = screenW - 100;
      const availH = screenH - MARGIN_TOP - 50;
      const rBasedOnWidth = availW / (cols * 1.5 + 0.5);
      const rBasedOnHeight = availH / (rows * Math.sqrt(3) + Math.sqrt(3) / 2);
      radius = Math.min(rBasedOnWidth, rBasedOnHeight);
      radius = Math.max(8, radius);
    }

    // --- 2. CONSTANTES ---
    const hexW = 2 * radius;
    const hexH = Math.sqrt(3) * radius;
    const horizDist = hexW * 0.75;
    const vertDist = hexH;

    // --- 3. POSICIONAMENTO ---
    // Se for raio fixo (mapa gigante), começamos centralizados,
    // mas o grid vai extrapolar a tela.
    const totalGridWidth = (cols - 1) * horizDist;
    const totalGridHeight = (rows - 1) * vertDist;

    const startX = screenW / 2 - totalGridWidth / 2;

    // Se o grid for maior que a tela, centraliza o topo, senão centraliza no meio
    let startY;
    if (fixedRadius) {
      startY = MARGIN_TOP + 50; // Começa um pouco abaixo do topo
    } else {
      startY = MARGIN_TOP + (screenH - MARGIN_TOP - 50 - totalGridHeight) / 2;
    }

    const positions = [];

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const yOffset = c % 2 !== 0 ? vertDist / 2 : 0;
        const x = startX + c * horizDist;
        const y = startY + r * vertDist + yOffset;

        positions.push({ x, y, col: c, row: r });
      }
    }

    return { positions, radius };
  }

  static generateHexPositions(geomPoly, targetCount) {
    // CORREÇÃO: Cálculo manual da área usando os pontos do polígono Phaser
    const area = this.calculatePolygonArea(geomPoly.points);

    // Proteção contra polígonos muito pequenos ou vazios
    if (area < 100) return { positions: [], radius: 10 };

    // Raio estimado
    let hexRadius = Math.sqrt(area / (targetCount * 2.6)) * 0.95;
    hexRadius = Math.max(15, hexRadius); // Aumentei levemente o raio mínimo para visibilidade

    // Dimensões Flat Topped
    const hexW = 2 * hexRadius;
    const hexH = Math.sqrt(3) * hexRadius;

    // Distância entre centros
    const horizDist = hexW * 0.75;
    const vertDist = hexH;

    const positions = [];
    const bounds = Phaser.Geom.Polygon.GetAABB(geomPoly);

    // Loop Grid
    for (let x = bounds.left; x < bounds.right; x += horizDist) {
      const colIndex = Math.round(x / horizDist);
      const offset = colIndex % 2 !== 0 ? vertDist / 2 : 0;

      for (let y = bounds.top + offset; y < bounds.bottom; y += vertDist) {
        // Verifica se o ponto central está dentro do polígono
        if (Phaser.Geom.Polygon.Contains(geomPoly, x, y)) {
          positions.push({ x, y });
        }
      }
    }

    return { positions, radius: hexRadius };
  }
}
