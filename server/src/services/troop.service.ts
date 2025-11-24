// src/services/troop.service.ts
import { prisma } from "../lib/prisma";
import { TROOP_DEFINITIONS, TroopDefinition } from "../data/troops";
import { UnitStats } from "../types";

export const TroopService = {
  // --- RECRUTAR ---
  async recruitTroop(matchId: string, userId: string, troopType: string) {
    // 1. Carrega dados
    const player = await prisma.matchPlayer.findFirst({
      where: { matchId, userId },
      include: { units: true, structures: true },
    });

    if (!player) throw new Error("Jogador inválido.");
    const def = TROOP_DEFINITIONS[troopType];
    if (!def) throw new Error("Tipo inválido.");

    // 2. Calcula Custo (Quantidade * 2)
    // Contamos quantas tropas DESSE TIPO o jogador tem
    const currentCount = player.units.filter(
      (u) => u.type === troopType
    ).length;

    // Regra: (1ª tropa custa 2, 2ª custa 4...) -> (0+1)*2 = 2.
    const cost = (currentCount + 1) * 2;

    const resources = JSON.parse(player.resources);
    if ((resources[def.resourceUsed] || 0) < cost) {
      throw new Error(
        `Recurso insuficiente. Precisa de ${cost} ${def.resourceUsed}.`
      );
    }

    // 3. Define os Stats da nova unidade
    // Verifica se já existe um template personalizado (evoluído), senão usa o base
    const templates = JSON.parse(player.troopTemplates || "{}");
    const statsToUse: UnitStats = templates[troopType] || def.baseStats;

    // 4. Executa transação (Paga e Cria)
    const capital = player.structures.find((s) => s.type === "CITADEL");
    const spawnIndex = capital ? capital.locationIndex : 0;

    resources[def.resourceUsed] -= cost;

    const newUnit = await prisma.unit.create({
      data: {
        matchId,
        ownerId: player.id,
        category: "TROPA",
        type: troopType,

        // Aplica os stats atuais (seja base ou evoluído)
        combat: statsToUse.combat,
        acuity: statsToUse.acuity,
        focus: statsToUse.focus,
        armor: statsToUse.armor,
        vitality: statsToUse.vitality,

        currentHp: statsToUse.vitality * 5, // Exemplo de regra HP
        movesLeft: 3,
        actionsLeft: 1,
        locationIndex: spawnIndex,
      },
    });

    // Atualiza saldo do jogador
    await prisma.matchPlayer.update({
      where: { id: player.id },
      data: { resources: JSON.stringify(resources) },
    });

    return newUnit;
  },

  // --- EVOLUIR (LEVEL UP) ---
  async upgradeTroop(
    matchId: string,
    userId: string,
    troopType: string,
    pointsDistribution: Partial<UnitStats> // Ex: { combat: 2 } ou { combat: 1, armor: 1 }
  ) {
    // 1. Validação de Pontos (+2 pontos exatos)
    const totalPoints = Object.values(pointsDistribution).reduce(
      (a, b) => a + b,
      0
    );
    if (totalPoints !== 2) {
      throw new Error("Você deve distribuir exatamente 2 pontos de atributo.");
    }

    const player = await prisma.matchPlayer.findFirst({
      where: { matchId, userId },
      include: { units: true, structures: true },
    });
    if (!player) throw new Error("Jogador não encontrado.");

    // 2. Validações de Regra (Capital e Nível Max)
    const levels = JSON.parse(player.troopLevels || "{}");
    const currentLevel = levels[troopType] || 1; // Nível padrão é 1 (0-10 na sua descrição, assumindo 1 como base)

    if (currentLevel >= 10) throw new Error("Nível máximo atingido.");

    const capital = player.structures.find((s) => s.type === "CITADEL");
    const hasTroopInCapital =
      capital &&
      player.units.some(
        (u) => u.type === troopType && u.locationIndex === capital.locationIndex
      );

    if (!hasTroopInCapital) {
      throw new Error(
        `É necessário ter um ${troopType} na Capital para evoluir.`
      );
    }

    // 3. Custo de XP (Tabela fixa ou formula simples?)
    // Sua tabela: 1->2 (2xp), 2->3 (3xp)... ou seja, Preço = NívelDestino
    const targetLevel = currentLevel + 1;
    const xpCost = targetLevel;

    const resources = JSON.parse(player.resources);
    if ((resources["EXPERIENCIA"] || 0) < xpCost) {
      throw new Error(`Experiência insuficiente. Custa ${xpCost} XP.`);
    }

    // 4. Calcula os Novos Atributos
    const templates = JSON.parse(player.troopTemplates || "{}");
    // Pega o atual ou o base
    const currentStats: UnitStats =
      templates[troopType] || TROOP_DEFINITIONS[troopType].baseStats;

    const newStats = {
      combat: currentStats.combat + (pointsDistribution.combat || 0),
      acuity: currentStats.acuity + (pointsDistribution.acuity || 0),
      focus: currentStats.focus + (pointsDistribution.focus || 0),
      armor: currentStats.armor + (pointsDistribution.armor || 0),
      vitality: currentStats.vitality + (pointsDistribution.vitality || 0),
    };

    // 5. ATUALIZAÇÃO NO BANCO (A "Mágica")
    // - Desconta XP
    // - Salva novo Nível
    // - Salva novo Template
    // - Atualiza TODAS as unidades existentes desse tipo

    resources["EXPERIENCIA"] -= xpCost;
    levels[troopType] = targetLevel;
    templates[troopType] = newStats;

    await prisma.$transaction([
      // Atualiza o Jogador (Template e Nivel)
      prisma.matchPlayer.update({
        where: { id: player.id },
        data: {
          resources: JSON.stringify(resources),
          troopLevels: JSON.stringify(levels),
          troopTemplates: JSON.stringify(templates),
        },
      }),
      // Atualiza as Unidades Vivas (UpdateMany)
      prisma.unit.updateMany({
        where: {
          matchId: matchId, // <--- TRAVA DE SEGURANÇA 1: Só nesta partida
          ownerId: player.id,
          type: troopType,
        },
        data: {
          combat: newStats.combat,
          acuity: newStats.acuity,
          focus: newStats.focus,
          armor: newStats.armor,
          vitality: newStats.vitality,
          // Nota: Não curamos a unidade (currentHp), mas se a vitalidade subiu, o maxHp teórico subiu.
        },
      }),
    ]);

    return {
      success: true,
      newLevel: targetLevel,
      newStats,
      message: `${troopType} evoluiu para o nível ${targetLevel}!`,
    };
  },
};
