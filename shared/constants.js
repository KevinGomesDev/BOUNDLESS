class Entity {
  constructor(id, ownerId, territoryId) {
    this.id = id;
    this.ownerId = ownerId; // Quem é o dono (Player 1, 2...)
    this.territoryId = territoryId; // Em qual território está
    this.type = "generic";
  }
}

class MobileUnit extends Entity {
  constructor(id, ownerId, territoryId) {
    super(id, ownerId, territoryId);
    this.canMove = true;
    this.moveRange = 1; // Quantos territórios pode andar
  }

  moveTo(newTerritoryId) {
    // Lógica de validação de movimento
    this.territoryId = newTerritoryId;
  }
}

class Structure extends Entity {
  constructor(id, ownerId, territoryId) {
    super(id, ownerId, territoryId);
    this.canMove = false;
    this.isCitadel = false;
  }
}

// A Cidadela é apenas uma Estrutura com uma flag especial ou status diferentes
class Citadel extends Structure {
  constructor(id, ownerId, territoryId) {
    super(id, ownerId, territoryId);
    this.isCitadel = true;
    this.hp = 1000; // Mais resistente
  }
}

export const TERRAIN_TYPES = {
  ICE: { color: 0xdbe7ff, name: "Gelo" }, // Azulado quase branco
  MOUNTAIN: { color: 0x778da9, name: "Montanha" },
  FOREST: { color: 0x2d6a4f, name: "Floresta" },
  PLAINS: { color: 0x95d5b2, name: "Planície" }, // Verde mais claro
  WASTELAND: { color: 0x6c584c, name: "Terra Devastada" },
  DESERT: { color: 0xe9c46a, name: "Deserto" },
  OCEAN: { color: 0x457b9d, name: "Mar Aberto" },
};
