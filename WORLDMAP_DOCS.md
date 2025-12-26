# 🗺️ Módulo WorldMap - Documentação Técnica

## Visão Geral

O módulo WorldMap é responsável por toda a lógica relacionada ao mapa-mundi do jogo Battle-Realm, incluindo geração procedural, renderização, interação e persistência de territórios.

---

## Arquitetura Backend

### 📂 `server/src/worldmap/`

#### **generation/** - Geração Procedural de Mapas

##### `MapGenerator.ts`

**Responsabilidade:** Criar mapas procedurais usando tesselação Voronoi

**Algoritmo:**

1. **Poisson Disc Sampling** - Distribui ~25 pontos de terra com distância mínima de 100px
2. **Grid de Água** - Cria bordas oceânicas ao redor da área jogável
3. **Delaunay Triangulation** → Voronoi Diagram (usando d3-delaunay)
4. **Atribuição de Biomas** - Cada ponto recebe terreno do seed mais próximo

**Parâmetros:**

- `width`: 2000px (padrão)
- `height`: 1600px (padrão)
- `MAP_SIZE`: 25 territórios de terra
- `MIN_TERRITORY_DIST`: 100px entre centros

**Output:**

```typescript
interface GeneratedTerritory {
  id: number;
  center: { x: number; y: number };
  type: "LAND" | "WATER";
  terrain: TerrainType;
  polygonPoints: [number, number][];
  size: "Pequeno" | "Médio" | "Grande" | "Vasto";
}
```

##### `BiomeGenerator.ts`

**Responsabilidade:** Distribuir tipos de terreno baseado em zonas climáticas

**Zonas de Latitude:**

```
Ártico (0-25%):        GELO
Subártico (25-35%):    MONTANHA
Temperado (35-65%):    FLORESTA / PLANÍCIE (50/50)
Subtrópico (65-80%):   TERRA DEVASTADA
Tropical (80-100%):    DESERTO
```

**Método Principal:**

- `generateBioSeeds(count)` - Cria pontos de controle com terrenos
- `getBiomeForPoint(x, y)` - Retorna terreno do seed mais próximo + ruído

---

#### **data/** - Configurações Estáticas

##### `terrains.ts`

**Estrutura:**

```typescript
export interface TerrainType {
  color: number; // Cor hexadecimal (0xRRGGBB)
  name: string; // Nome para exibição
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
```

---

#### **handlers/** - Eventos Socket.io

##### `worldmap.handler.ts`

**Eventos Registrados:**

| Evento                   | Direção            | Parâmetros        | Resposta                  | Descrição                                   |
| ------------------------ | ------------------ | ----------------- | ------------------------- | ------------------------------------------- |
| `worldmap:get_terrains`  | Cliente → Servidor | -                 | `worldmap:terrains_data`  | Envia TERRAIN_TYPES                         |
| `worldmap:request_map`   | Cliente → Servidor | `{ matchId? }`    | `worldmap:map_data`       | Envia array de Territory[]                  |
| `worldmap:get_territory` | Cliente → Servidor | `{ territoryId }` | `worldmap:territory_data` | Detalhes do território com units/structures |

**Fallback:** Se `matchId` não for passado em `request_map`, busca última partida ACTIVE.

---

## Arquitetura Frontend

### 📂 `client/src/worldmap/`

#### **rendering/** - Sistema de Renderização

##### `MapRenderer.js`

**Responsabilidade:** Desenhar territórios em camadas gráficas

**Camadas (Z-Index implícito por ordem de criação):**

```javascript
waterLayer; // Oceano (azul #457b9d, alpha 0.8)
landLayer; // Territórios (cores de bioma, alpha 1.0)
borderLayer; // Bordas pretas (2px, alpha 0.3)
selectionLayer; // Seleção fixa dourada (4px)
overlayLayer; // Hover branco (2px, alpha 0.8)
```

**Métodos Principais:**

- `render(territoriesData)` - Desenha todos os territórios e registra hit areas
- `getTerritoryAt(worldX, worldY)` - Retorna território no ponto (hit detection)
- `highlightHover(territoryData)` - Desenha borda branca temporária
- `highlightSelection(territoryData)` - Desenha borda dourada persistente
- `clear()` - Limpa todas as camadas

**Hit Detection:**

```javascript
// Usa Phaser.Geom.Polygon.Contains() para testar se ponto está dentro
for (let [index, data] of territoryMap) {
  if (Phaser.Geom.Polygon.Contains(data.geom, worldX, worldY)) {
    return data;
  }
}
```

---

#### **camera/** - Controle de Navegação

##### `CameraController.js`

**Responsabilidade:** Pan e zoom no mapa

**Controles:**

- **Zoom:** Roda do mouse

  - Range: `minZoom` (calculado dinamicamente) até 4.0x
  - Speed: 5% do zoom atual (proporcional)
  - Pivot: Centralizado no viewport

- **Pan:** Botão direito + arrastar
  - Movimento inverso do mouse (natural)
  - Compensação por zoom (`deltaX / cam.zoom`)
  - Limites automáticos via `cam.setBounds()`

**Responsividade:**

```javascript
minZoom = Math.max(width / mapWidth, height / mapHeight);
// Garante que o mapa sempre preenche a tela (sem bordas pretas)
```

**Listener de Resize:**

```javascript
this.scene.scale.on("resize", this.handleResize, this);
// Recalcula minZoom e ajusta viewport quando janela muda
```

---

#### **territories/** - Sistema de Territórios

##### `TerritoryModal.js`

**Responsabilidade:** Modal com visão detalhada do território

**Pipeline:**

1. `normalizePolygon()` - Escala polígono para ocupar 70% da tela
2. `drawBorder()` - Borda branca 4px
3. `determineTerritorySize()` - Mapeia "Pequeno/Médio/Grande" → 10/20/30 hexágonos
4. `generateHexPositions()` - Preenche polígono com hexágonos
5. `createHexagons()` - Instancia `InteractiveHexagon` para cada posição

**Interação:**

- **Backdrop (preto 70% opaco):** Fecha modal ao clicar
- **Hexágonos:** Callback `onSelect(id)` para gameplay futuro
- **ScrollFactor(0):** Fixa modal na tela (ignora movimento de câmera)

##### `InteractiveHexagon.js`

**Responsabilidade:** Componente de hexágono clicável

**Estados:**

- **Normal:** Cor base do terreno
- **Hover:** Branco + borda grossa
- **Selected:** Dourado + borda 3px

**Hit Area:**

```javascript
// Cria polígono de 6 vértices para hit detection
for (let i = 0; i < 6; i++) {
  const angle = Phaser.Math.DegToRad(60 * i);
  points.push({
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  });
}
```

##### `InteractionHandler.js`

**Responsabilidade:** Gerenciar hover e cliques no mapa principal

**Lógica de Clique:**

```javascript
if (firstClick) {
  // Seleciona território (borda dourada)
  selectedTerritory = clicked;
  mapRenderer.highlightSelection(clicked);
} else if (secondClick) {
  // Abre TerritoryModal
  scene.openTerritoryModal(clicked);
}
```

**Filtros:**

- Ignora interação se modal estiver aberto
- Só permite seleção de territórios `type === "LAND"`
- Limpa hover durante drag

---

#### **scenes/** - Cena Principal

##### `GameScene.js`

**Responsabilidade:** Orquestrar mapa, câmera e modais

**Lifecycle:**

```javascript
create() {
  1. scene.launch("UIScene") // HUD overlay
  2. emit("worldmap:get_terrains")
  3. on("worldmap:terrains_data") → emit("worldmap:request_map")
  4. on("worldmap:map_data") → mapRenderer.render()
  5. Instancia CameraController
}

update() {
  1. cameraController.update()
  2. handleHoverLoop() // Atualiza tooltip
}
```

**Modais:**

- **TerritoryModal:** Duplo clique em território
- **CombatModal:** Tecla `C` com território selecionado

**Estado:**

- `selectedTerritory` - Território com borda dourada
- `hoveredTerritory` - Território sob cursor (tooltip)
- `isModalOpen` - Flag para desabilitar interação com mapa

---

## Fluxo de Dados

### Criação de Partida

```
1. Cliente: emit("match:create", { userId, kingdomId })
2. Servidor:
   - Cria Match (status: WAITING)
   - MapGenerator.generate() → 25 territórios
   - Salva em Territory (Prisma)
   - Sorteia 3 com hasCrisisIntel: true
3. Cliente: emit("match:created_success", { matchId })
```

### Carregamento de Mapa

```
1. Cliente: emit("worldmap:get_terrains")
2. Servidor: emit("worldmap:terrains_data", TERRAIN_TYPES)
3. Cliente: emit("worldmap:request_map", { matchId })
4. Servidor:
   - Busca Territory[] WHERE matchId
   - emit("worldmap:map_data", territories)
5. Cliente: mapRenderer.render(territories)
```

---

## Utilitários

### `GridCalculator.js`

**Funções:**

#### `normalizePolygon(rawPoly, screenW, screenH)`

Escala e centraliza polígono para tela:

```javascript
return {
  points: [{x, y}...],      // Pontos normalizados
  phaserPoly: Phaser.Geom.Polygon, // Para hit detection
  scale: number             // Fator de escala aplicado
}
```

#### `generateHexPositions(geomPoly, targetCount)`

Preenche polígono com hexágonos:

```javascript
1. Calcula área usando Shoelace Formula
2. Estima raio: √(área / targetCount * 2.6)
3. Gera grid retangular sobre bounding box
4. Filtra hexágonos dentro do polígono
return { positions: [{x,y}...], radius }
```

#### `generateRectangularGrid(cols, rows, screenW, screenH, fixedRadius)`

Grid para CombatModal:

```javascript
- Offset de colunas ímpares (shift vertical de 0.75 * height)
- Suporta raio fixo ou calculado
- Centraliza baseado em tamanho total
```

---

## Integração com Sistema de Crise

**Ao criar Match:**

- 3 territórios aleatórios recebem `hasCrisisIntel: true`
- Tipo sorteado (KAIJU/WALKERS/AMORPHOUS) em `Match.crisisState` (JSON)
- Jogador investiga territórios para descobrir mecânica

**Revelação:**

- Território com intel mostra hint quando selecionado
- Após 3 hints, crise é ativada

---

## Performance

**Otimizações:**

- **Batch Rendering:** Todas as camadas usam `Graphics.fillPoints()` (não cria sprites individuais)
- **Hit Detection:** Map lookup O(n) com early return
- **Scroll Factor:** UI e modais com `setScrollFactor(0)` para evitar recálculos
- **Clear on Demand:** Camadas só limpam quando necessário (não todo frame)

**Limites:**

- 25 territórios de terra + ~50 de água = **~75 polígonos**
- ~10-30 hexágonos por TerritoryModal = **~100 sprites temporários**
- CombatModal: 16×12 = **192 hexágonos fixos**

---

## Testes Manuais

### Backend

```bash
# Terminal 1: Servidor
cd server
npm run dev

# Terminal 2: Teste de geração
node -e "
const { MapGenerator } = require('./dist/worldmap/generation/MapGenerator');
const gen = new MapGenerator();
const map = gen.generate();
console.log('Territórios gerados:', map.length);
"
```

### Frontend

```bash
cd client
npm run dev
# Abrir DevTools Console
# Verificar logs de renderização
```

**Checklist:**

- [ ] Mapa renderiza sem bordas pretas
- [ ] Zoom funciona (min até 4x)
- [ ] Pan com botão direito
- [ ] Hover mostra tooltip e borda branca
- [ ] Clique seleciona (borda dourada)
- [ ] Duplo clique abre modal
- [ ] Modal fecha ao clicar no backdrop
- [ ] Hexágonos do modal respondem a hover

---

## Troubleshooting

### "TERRAIN_TYPES está vazio"

**Causa:** Import circular ou servidor não inicializado
**Solução:** Verificar `server.ts` importa `registerWorldMapHandlers`

### "Modal não fecha"

**Causa:** `isModalOpen` não atualizado ou backdrop sem `setInteractive()`
**Solução:** Verificar `closeModal()` chama `hide()` e `setVisible(false)`

### "Bordas pretas no zoom out"

**Causa:** `minZoom` menor que necessário
**Solução:** `minZoom = Math.max(w/mapW, h/mapH)` deve usar MAIOR valor

### "Hexágonos não aparecem no modal"

**Causa:** Polígono vazio ou `generateHexPositions()` retorna array vazio
**Solução:** Debug `console.log(gridData.positions.length)` deve ser > 0

---

## Roadmap

- [ ] **Cache de Mapa:** Persistir mapa renderizado em Texture para performance
- [ ] **Mini-Mapa:** Thumbnail do mapa no canto da tela
- [ ] **Fog of War:** Territórios não explorados ficam escuros
- [ ] **Animações:** Transição suave de seleção e hover
- [ ] **Clusters:** Agrupar territórios por clima para lore
- [ ] **Geração Customizada:** Parâmetros de mapa (tamanho, densidade, biomas)
