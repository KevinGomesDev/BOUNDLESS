// src/handlers/battle.handler.ts
import { Socket, Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { TurnType } from "../types";
import {
  rollInitiative,
  validateGridMove,
  getMaxMarksByCategory,
  getEffectiveAcuityWithConditions,
  applyBurningOnAction,
  applyProtectionDamage,
  rollD6,
  countSuccesses,
} from "../utils/battle.utils";

export const registerBattleHandlers = (io: Server, socket: Socket) => {
  // Iniciar batalha com grid 20x20 e ordem de iniciativa
  socket.on(
    "battle:start",
    async ({ matchId, attackerUnitIds = [], defenderUnitIds = [] }) => {
      try {
        const match = await prisma.match.findUnique({ where: { id: matchId } });
        if (!match) {
          socket.emit("error", { message: "Partida não encontrada" });
          return;
        }
        if (match.currentTurn !== TurnType.BATALHA) {
          socket.emit("error", {
            message: "Combate só pode iniciar no Turno de Batalha",
          });
          return;
        }

        const gridWidth = 20,
          gridHeight = 20;
        const battle = await prisma.battle.create({
          data: {
            matchId,
            gridWidth,
            gridHeight,
            initiativeOrder: "[]",
            status: "ACTIVE",
          },
        });

        const unitIds: string[] = [...attackerUnitIds, ...defenderUnitIds];
        const units = await prisma.unit.findMany({
          where: { id: { in: unitIds } },
        });

        // Posicionamento simples: atacantes nas linhas 0-1, defensores nas 18-19
        const battleUnitsData: any[] = [];
        let ax = 0,
          ay = 0,
          dx = 0,
          dy = gridHeight - 2;

        for (const u of units) {
          const isAttacker = attackerUnitIds.includes(u.id);
          const posX = isAttacker ? ax++ % gridWidth : dx++ % gridWidth;
          const posY = isAttacker
            ? ay + Math.floor(ax / gridWidth)
            : dy + Math.floor(dx / gridWidth);

          battleUnitsData.push({
            battleId: battle.id,
            unitId: u.id,
            ownerId: u.ownerId!,
            posX,
            posY,
            initiative: Math.floor(Math.random() * 20) + 1 + u.acuity, // D20 + Acuity
            movesLeft: 0,
            actionsLeft: 1,
            protection: (u.armor || 0) * 2,
            protectionBroken: false,
            actionMarks: 0,
            conditions: "[]",
          });
        }

        if (battleUnitsData.length > 0) {
          await prisma.battleUnit.createMany({ data: battleUnitsData });
        }

        const createdBus = await prisma.battleUnit.findMany({
          where: { battleId: battle.id },
        });
        const ordered = rollInitiative(createdBus);
        const orderIds = JSON.stringify(ordered.map((bu) => bu.id));

        await prisma.battle.update({
          where: { id: battle.id },
          data: { initiativeOrder: orderIds, currentTurnIndex: 0 },
        });

        await prisma.battleLog.create({
          data: {
            battleId: battle.id,
            type: "START",
            payload: JSON.stringify({ attackerUnitIds, defenderUnitIds }),
          },
        });

        io.to(matchId).emit("battle:started", {
          battleId: battle.id,
          grid: { width: gridWidth, height: gridHeight },
          order: ordered,
        });
      } catch (err) {
        console.error("[BATTLE] start error:", err);
        socket.emit("error", { message: "Erro ao iniciar batalha" });
      }
    }
  );

  // Declaração de suprimentos (leilão) e definição de ordem de ação por jogadores
  socket.on("battle:declare_supply", async ({ battleId, playerId, bid }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle)
        return socket.emit("error", { message: "Batalha não encontrada" });

      const bids = JSON.parse(battle.supplyBids || "{}");
      const prev = bids[playerId] || 0;
      if (bid < prev) {
        return socket.emit("error", { message: "Lances devem ser crescentes" });
      }

      bids[playerId] = bid;
      const entries = Object.entries(bids) as Array<[string, number]>;
      entries.sort((a, b) => b[1] - a[1]);
      const actionOrder = entries.map(([pid]) => pid);

      await prisma.battle.update({
        where: { id: battle.id },
        data: {
          supplyBids: JSON.stringify(bids),
          actionOrder: JSON.stringify(actionOrder),
          currentTurnIndex: 0,
        },
      });

      io.to(battle.matchId).emit("battle:action_order_updated", {
        battleId,
        actionOrder,
      });
    } catch (err) {
      console.error("[BATTLE] declare_supply error:", err);
      socket.emit("error", { message: "Erro no leilão de suprimentos" });
    }
  });

  socket.on("battle:get_action_order", async ({ battleId }) => {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle)
      return socket.emit("error", { message: "Batalha não encontrada" });
    const order = JSON.parse(battle.actionOrder || "[]");
    socket.emit("battle:action_order", { battleId, actionOrder: order });
  });

  // Começar ação de uma unidade (valida marcas e condições; configura movimentos = acuidade efetiva)
  socket.on(
    "battle:begin_action",
    async ({ battleId, battleUnitId, playerId }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle)
          return socket.emit("error", { message: "Batalha não encontrada" });
        const order = JSON.parse(battle.actionOrder || "[]");
        if (order.length) {
          const currentPlayerId = order[battle.currentTurnIndex] as string;
          if (currentPlayerId !== playerId) {
            return socket.emit("error", { message: "Não é sua vez de agir" });
          }
        }

        const bu = await prisma.battleUnit.findUnique({
          where: { id: battleUnitId },
        });
        if (!bu || !bu.isAlive)
          return socket.emit("error", { message: "Unidade inválida" });
        if (bu.ownerId !== playerId)
          return socket.emit("error", {
            message: "Você não controla esta unidade",
          });
        const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
        if (!unit)
          return socket.emit("error", {
            message: "Dados da unidade inválidos",
          });

        const conditions = JSON.parse(bu.conditions || "[]");
        if (conditions.includes("DESABILITADA")) {
          return socket.emit("error", {
            message: "Unidade desabilitada não pode agir",
          });
        }
        const maxMarks = getMaxMarksByCategory(unit.category);
        if (bu.actionMarks >= maxMarks) {
          return socket.emit("error", {
            message: "Esta unidade já atingiu suas marcas de ação",
          });
        }

        const effectiveAcuity = getEffectiveAcuityWithConditions(
          unit.acuity,
          conditions
        );
        await prisma.battleUnit.update({
          where: { id: bu.id },
          data: { movesLeft: effectiveAcuity, actionsLeft: 1 },
        });

        socket.emit("battle:action_started", {
          battleId,
          battleUnitId,
          movesLeft: effectiveAcuity,
        });
      } catch (err) {
        console.error("[BATTLE] begin_action error:", err);
        socket.emit("error", { message: "Erro ao iniciar ação" });
      }
    }
  );

  // Finaliza ação da unidade: aplica queimando, incrementa marca, avança jogador e checa fim da batalha
  socket.on("battle:end_unit_action", async ({ battleId, battleUnitId }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle) return;
      const bu = await prisma.battleUnit.findUnique({
        where: { id: battleUnitId },
      });
      if (!bu) return;
      const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
      if (!unit) return;

      const conditions = JSON.parse(bu.conditions || "[]");
      const hpAfterBurn = applyBurningOnAction(unit.currentHp, conditions);
      if (hpAfterBurn !== unit.currentHp) {
        await prisma.unit.update({
          where: { id: unit.id },
          data: { currentHp: hpAfterBurn },
        });
      }

      // Derrubada se levanta no fim do turno
      const newConds = conditions.filter((c: string) => c !== "DERRUBADA");
      const maxMarks = getMaxMarksByCategory(unit.category);
      const nextMarks = Math.min(maxMarks, (bu.actionMarks || 0) + 1);

      await prisma.battleUnit.update({
        where: { id: bu.id },
        data: {
          conditions: JSON.stringify(newConds),
          actionMarks: nextMarks,
          movesLeft: 0,
          actionsLeft: 0,
        },
      });

      // Avança jogador na ordem
      const order = JSON.parse(battle.actionOrder || "[]") as string[];
      if (order.length) {
        const nextIdx = (battle.currentTurnIndex + 1) % order.length;
        await prisma.battle.update({
          where: { id: battle.id },
          data: { currentTurnIndex: nextIdx },
        });
        io.to(battle.matchId).emit("battle:next_player", {
          battleId,
          currentPlayerId: order[nextIdx],
          index: nextIdx,
        });
      }

      // Checa término: todas as unidades vivas atingiram marcas máximas
      const bus = await prisma.battleUnit.findMany({
        where: { battleId: battle.id, isAlive: true },
      });
      let allDone = true;
      for (const x of bus) {
        const xu = await prisma.unit.findUnique({ where: { id: x.unitId } });
        if (!xu) continue;
        const m = getMaxMarksByCategory(xu.category);
        if ((x.actionMarks || 0) < m) {
          allDone = false;
          break;
        }
      }
      if (allDone) {
        await prisma.battle.update({
          where: { id: battle.id },
          data: { status: "ENDED" },
        });
        io.to(battle.matchId).emit("battle:ended", { battleId });
      }
    } catch (err) {
      console.error("[BATTLE] end_unit_action error:", err);
      socket.emit("error", { message: "Erro ao finalizar ação" });
    }
  });

  // Movimentar unidade no grid 20x20, persistindo no servidor
  socket.on("battle:move", async ({ battleId, battleUnitId, toX, toY }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle || battle.status !== "ACTIVE") {
        socket.emit("error", { message: "Batalha inválida" });
        return;
      }

      const bu = await prisma.battleUnit.findUnique({
        where: { id: battleUnitId },
      });
      if (!bu || !bu.isAlive) {
        socket.emit("error", { message: "Unidade inválida" });
        return;
      }

      // Agarrado não pode se mover
      const condsMove = JSON.parse(bu.conditions || "[]");
      if (condsMove.includes("AGARRADO")) {
        socket.emit("error", { message: "Unidade agarrada não pode se mover" });
        return;
      }

      const can = validateGridMove(
        bu.posX,
        bu.posY,
        toX,
        toY,
        battle.gridWidth,
        battle.gridHeight,
        bu.movesLeft
      );
      if (!can.valid) {
        socket.emit("error", { message: can.reason });
        return;
      }

      // Impede ocupar célula já ocupada por unidade viva
      const occupied = await prisma.battleUnit.findFirst({
        where: {
          battleId: battle.id,
          posX: toX,
          posY: toY,
          isAlive: true,
        },
      });
      if (occupied && occupied.id !== bu.id) {
        socket.emit("error", { message: "A célula de destino está ocupada" });
        return;
      }

      // Impede ocupar célula com cadáver não removido
      const corpseBlock = await prisma.battleUnit.findFirst({
        where: {
          battleId: battle.id,
          posX: toX,
          posY: toY,
          isAlive: false,
        },
      });
      if (corpseBlock) {
        const corpseConds = JSON.parse(corpseBlock.conditions || "[]");
        if (!corpseConds.includes("CORPSE_REMOVED")) {
          socket.emit("error", { message: "Há um obstáculo no destino" });
          return;
        }
      }

      await prisma.battleUnit.update({
        where: { id: bu.id },
        data: { posX: toX, posY: toY, movesLeft: bu.movesLeft - can.cost },
      });

      await prisma.battleLog.create({
        data: {
          battleId: battle.id,
          type: "MOVE",
          payload: JSON.stringify({
            battleUnitId,
            from: [bu.posX, bu.posY],
            to: [toX, toY],
          }),
        },
      });

      io.to(battle.matchId).emit("battle:unit_moved", {
        battleId,
        battleUnitId,
        toX,
        toY,
      });
    } catch (err) {
      console.error("[BATTLE] move error:", err);
      socket.emit("error", { message: "Erro ao mover na batalha" });
    }
  });

  // Atacar unidade adjacente; atualiza HP e derrota
  socket.on(
    "battle:attack",
    async ({
      battleId,
      attackerBattleUnitId,
      targetBattleUnitId,
      damageType = "FISICO",
    }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle || battle.status !== "ACTIVE") {
          socket.emit("error", { message: "Batalha inválida" });
          return;
        }

        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !attackerBU.isAlive) {
          socket.emit("error", { message: "Atacante inválido" });
          return;
        }
        if (!targetBU || !targetBU.isAlive) {
          socket.emit("error", { message: "Alvo inválido" });
          return;
        }

        if (attackerBU.actionsLeft <= 0) {
          socket.emit("error", { message: "Sem ações restantes" });
          return;
        }

        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1) {
          socket.emit("error", {
            message: "O alvo deve estar adjacente (ataque corpo a corpo)",
          });
          return;
        }

        const attackerUnit = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const targetUnit = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attackerUnit || !targetUnit) {
          socket.emit("error", { message: "Unidades base não encontradas" });
          return;
        }

        // Apply base damage from stats (legacy handler) with PROTECTED check
        let baseDamage = Math.max(1, attackerUnit.combat - targetUnit.armor);
        const tCondsLegacy = JSON.parse(targetBU.conditions || "[]");
        if (tCondsLegacy.includes("PROTECTED")) {
          baseDamage = Math.max(0, baseDamage - 5);
          const newConds = tCondsLegacy.filter(
            (c: string) => c !== "PROTECTED"
          );
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { conditions: JSON.stringify(newConds) },
          });
        }
        const resolved = applyProtectionDamage(
          targetBU.protection || 0,
          !!targetBU.protectionBroken,
          targetUnit.currentHp,
          baseDamage,
          damageType
        );

        await prisma.battleUnit.update({
          where: { id: targetBU.id },
          data: {
            protection: resolved.newProtection,
            protectionBroken: resolved.newProtectionBroken,
          },
        });

        if (resolved.newHp !== targetUnit.currentHp) {
          await prisma.unit.update({
            where: { id: targetUnit.id },
            data: { currentHp: resolved.newHp },
          });
        }

        let defeated = false;
        if ((resolved.newHp || 0) <= 0) {
          defeated = true;
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { isAlive: false },
          });
          // Cria obstáculo de cadáver (marcado em BattleUnit via corpseRemoved=false por padrão)
          // Cascade: if target unit is a summoner, kill its summons
          const targetSummons = await prisma.unit.findMany({
            where: { summonerId: targetUnit.id, matchId: battle.matchId },
          });
          for (const s of targetSummons) {
            // Mark battle unit dead if present
            const sBU = await prisma.battleUnit.findFirst({
              where: { battleId: battle.id, unitId: s.id },
            });
            if (sBU) {
              await prisma.battleUnit.update({
                where: { id: sBU.id },
                data: { isAlive: false },
              });
              await prisma.battleLog.create({
                data: {
                  battleId: battle.id,
                  type: "SUMMON_CASCADE_KILL",
                  payload: JSON.stringify({
                    parentUnitId: targetUnit.id,
                    summonUnitId: s.id,
                  }),
                },
              });
            }
            // Set unit HP to 0
            if (s.currentHp > 0) {
              await prisma.unit.update({
                where: { id: s.id },
                data: { currentHp: 0 },
              });
            }
          }
        }

        // Consome 1 ação do atacante
        await prisma.battleUnit.update({
          where: { id: attackerBU.id },
          data: { actionsLeft: Math.max(0, attackerBU.actionsLeft - 1) },
        });

        await prisma.battleLog.create({
          data: {
            battleId: battle.id,
            type: defeated ? "ATTACK_KILL" : "ATTACK",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              damage: baseDamage,
              damageType,
              targetHpAfter: resolved.newHp,
            }),
          },
        });

        io.to(battle.matchId).emit("battle:unit_attacked", {
          battleId,
          attackerBattleUnitId,
          targetBattleUnitId,
          damage: baseDamage,
          damageType,
          targetHpAfter: resolved.newHp,
        });

        if (defeated) {
          io.to(battle.matchId).emit("battle:unit_defeated", {
            battleId,
            battleUnitId: targetBU.id,
            unitId: targetUnit.id,
          });
          // Checa se um lado não possui unidades vivas restantes
          const aliveByOwner = await prisma.battleUnit.groupBy({
            by: ["ownerId"],
            where: { battleId: battle.id, isAlive: true },
            _count: { _all: true },
          });
          const ownersWithAlive = aliveByOwner
            .filter((g) => g._count._all > 0)
            .map((g) => g.ownerId);
          const uniqueOwners = new Set(ownersWithAlive);
          if (uniqueOwners.size <= 1) {
            await prisma.battle.update({
              where: { id: battle.id },
              data: { status: "ENDED" },
            });
            io.to(battle.matchId).emit("battle:ended", { battleId });
          }
        }
      } catch (err) {
        console.error("[BATTLE] attack error:", err);
        socket.emit("error", { message: "Erro ao atacar" });
      }
    }
  );

  // ---------- Combat Actions ----------

  // Ataque (1D6 por cada 4 de Combate; dano = somatório)
  socket.on(
    "battle:action_attack",
    async ({
      battleId,
      attackerBattleUnitId,
      targetBattleUnitId,
      damageType = "FISICO",
    }) => {
      // Wraps battle:attack with dice-based damage per spec
      try {
        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !targetBU)
          return socket.emit("error", { message: "Unidades inválidas" });
        const attackerUnit = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const targetUnit = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attackerUnit || !targetUnit)
          return socket.emit("error", {
            message: "Dados de unidade inválidos",
          });

        // Adjacent check
        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "O alvo deve estar adjacente",
          });

        // Dice: floor(combat/4) D6; sum as damage
        const diceCount = Math.max(1, Math.floor(attackerUnit.combat / 4));
        const rolls = rollD6(diceCount);
        const rollSum = rolls.reduce((a, b) => a + b, 0);

        // Apply PROTECTED (-5 once)
        let damageToApply = rollSum;
        const tConds = JSON.parse(targetBU.conditions || "[]");
        if (tConds.includes("PROTECTED")) {
          damageToApply = Math.max(0, damageToApply - 5);
          const newConds = tConds.filter((c: string) => c !== "PROTECTED");
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { conditions: JSON.stringify(newConds) },
          });
        }

        const resolved = applyProtectionDamage(
          targetBU.protection || 0,
          !!targetBU.protectionBroken,
          targetUnit.currentHp,
          damageToApply,
          damageType
        );

        await prisma.battleUnit.update({
          where: { id: targetBU.id },
          data: {
            protection: resolved.newProtection,
            protectionBroken: resolved.newProtectionBroken,
          },
        });
        if (resolved.newHp !== targetUnit.currentHp) {
          await prisma.unit.update({
            where: { id: targetUnit.id },
            data: { currentHp: resolved.newHp },
          });
        }

        // Consume action
        await prisma.battleUnit.update({
          where: { id: attackerBU.id },
          data: { actionsLeft: Math.max(0, attackerBU.actionsLeft - 1) },
        });

        const defeated = (resolved.newHp || 0) <= 0;
        await prisma.battleLog.create({
          data: {
            battleId,
            type: defeated ? "ACTION_ATTACK_KILL" : "ACTION_ATTACK",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              rolls,
              rollSum,
              damageApplied: damageToApply,
              damageType,
              targetHpAfter: resolved.newHp,
            }),
          },
        });

        io.to(
          (await prisma.battle.findUnique({ where: { id: battleId } }))!.matchId
        ).emit("battle:unit_attacked", {
          battleId,
          attackerBattleUnitId,
          targetBattleUnitId,
          damage: damageToApply,
          damageType,
          rollSum,
          rolls,
          targetHpAfter: resolved.newHp,
        });

        if (defeated) {
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { isAlive: false },
          });
          io.to(
            (await prisma.battle.findUnique({ where: { id: battleId } }))!
              .matchId
          ).emit("battle:unit_defeated", {
            battleId,
            battleUnitId: targetBU.id,
            unitId: targetUnit.id,
          });
        }
      } catch (err) {
        console.error("[BATTLE] action_attack error:", err);
        socket.emit("error", { message: "Erro em Ataque" });
      }
    }
  );

  // Corrida (Dash): ganhos extras de movimento iguais à Acuidade ou Combate
  socket.on(
    "battle:action_dash",
    async ({ battleId, battleUnitId, attribute = "ACUIDADE" }) => {
      try {
        const bu = await prisma.battleUnit.findUnique({
          where: { id: battleUnitId },
        });
        if (!bu || !bu.isAlive)
          return socket.emit("error", { message: "Unidade inválida" });
        const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
        if (!unit)
          return socket.emit("error", {
            message: "Dados de unidade inválidos",
          });
        const conds = JSON.parse(bu.conditions || "[]");
        const extra =
          attribute === "COMBATE"
            ? unit.combat
            : getEffectiveAcuityWithConditions(unit.acuity, conds);
        await prisma.battleUnit.update({
          where: { id: bu.id },
          data: { movesLeft: (bu.movesLeft || 0) + extra },
        });
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_DASH",
            payload: JSON.stringify({ battleUnitId, attribute, extra }),
          },
        });
        socket.emit("battle:dash_applied", { battleId, battleUnitId, extra });
      } catch (err) {
        console.error("[BATTLE] action_dash error:", err);
        socket.emit("error", { message: "Erro em Corrida" });
      }
    }
  );

  // Conjurar (Taxa: 1 Arcana), teste de Foco CD:4; sucessos definem efeitos
  socket.on(
    "battle:action_cast",
    async ({ battleId, battleUnitId, spellId }) => {
      try {
        const bu = await prisma.battleUnit.findUnique({
          where: { id: battleUnitId },
        });
        if (!bu || !bu.isAlive)
          return socket.emit("error", { message: "Unidade inválida" });
        const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
        if (!unit)
          return socket.emit("error", {
            message: "Dados de unidade inválidos",
          });
        const player = await prisma.matchPlayer.findUnique({
          where: { id: bu.ownerId },
        });
        if (!player)
          return socket.emit("error", { message: "Jogador inválido" });
        const resources = JSON.parse(player.resources);
        if ((resources.arcana || 0) < 1)
          return socket.emit("error", { message: "Arcana insuficiente" });
        resources.arcana = (resources.arcana || 0) - 1;
        await prisma.matchPlayer.update({
          where: { id: player.id },
          data: { resources: JSON.stringify(resources) },
        });

        // HELP_NEXT: reduz CD em 1 na próxima ação ativa
        const conds = JSON.parse(bu.conditions || "[]");
        const thresholdBase = 4;
        const threshold = conds.includes("HELP_NEXT")
          ? Math.max(2, thresholdBase - 1)
          : thresholdBase;
        // remove HELP_NEXT if present (consumed)
        if (conds.includes("HELP_NEXT")) {
          const newConds = conds.filter((c: string) => c !== "HELP_NEXT");
          await prisma.battleUnit.update({
            where: { id: bu.id },
            data: { conditions: JSON.stringify(newConds) },
          });
        }

        const rolls = rollD6(unit.focus);
        const successes = countSuccesses(rolls, threshold);
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_CAST",
            payload: JSON.stringify({
              battleUnitId,
              spellId,
              rolls,
              successes,
              threshold,
            }),
          },
        });
        io.to(
          (await prisma.battle.findUnique({ where: { id: battleId } }))!.matchId
        ).emit("battle:spell_cast", {
          battleId,
          battleUnitId,
          spellId,
          rolls,
          successes,
        });
      } catch (err) {
        console.error("[BATTLE] action_cast error:", err);
        socket.emit("error", { message: "Erro em Conjurar" });
      }
    }
  );

  // Fuga: teste de Acuidade resistido pela Acuidade do inimigo mais próximo; se sucesso, remove da batalha
  socket.on("battle:action_flee", async ({ battleId, battleUnitId }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle) return;
      const bu = await prisma.battleUnit.findUnique({
        where: { id: battleUnitId },
      });
      if (!bu || !bu.isAlive)
        return socket.emit("error", { message: "Unidade inválida" });
      const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
      if (!unit)
        return socket.emit("error", { message: "Dados de unidade inválidos" });

      // Enemy nearest
      const enemies = await prisma.battleUnit.findMany({
        where: { battleId, isAlive: true, ownerId: { not: bu.ownerId } },
      });
      if (!enemies.length)
        return socket.emit("error", { message: "Sem inimigos na batalha" });
      let nearest = enemies[0];
      let bestDist =
        Math.abs(bu.posX - nearest.posX) + Math.abs(bu.posY - nearest.posY);
      for (const e of enemies.slice(1)) {
        const d = Math.abs(bu.posX - e.posX) + Math.abs(bu.posY - e.posY);
        if (d < bestDist) {
          bestDist = d;
          nearest = e;
        }
      }

      const attackerRolls = rollD6(unit.acuity);
      const attackerSucc = countSuccesses(attackerRolls, 4);
      const defenderUnit = await prisma.unit.findUnique({
        where: { id: nearest.unitId },
      });
      const defenderRolls = rollD6(defenderUnit!.acuity);
      const defenderSucc = countSuccesses(defenderRolls, 4);

      const helped = JSON.parse(bu.conditions || "[]").includes("HELP_NEXT");
      const finalAttackerSucc = helped ? attackerSucc + 1 : attackerSucc; // +1D equivalence simplified
      // Consume HELP_NEXT if present
      if (helped) {
        const newConds = JSON.parse(bu.conditions || "[]").filter(
          (c: string) => c !== "HELP_NEXT"
        );
        await prisma.battleUnit.update({
          where: { id: bu.id },
          data: { conditions: JSON.stringify(newConds) },
        });
      }

      const success = finalAttackerSucc > defenderSucc;
      await prisma.battleLog.create({
        data: {
          battleId,
          type: "ACTION_FLEE",
          payload: JSON.stringify({
            battleUnitId,
            attackerRolls,
            defenderRolls,
            attackerSucc: finalAttackerSucc,
            defenderSucc,
            success,
          }),
        },
      });
      if (!success) return socket.emit("error", { message: "Falha na fuga" });

      // Remove BU from battle and place unit at capital territory if available
      await prisma.battleUnit.delete({ where: { id: bu.id } });
      const capital = await prisma.territory.findFirst({
        where: {
          matchId: battle.matchId,
          isCapital: true,
          ownerId: bu.ownerId,
        },
      });
      if (capital) {
        await prisma.unit.update({
          where: { id: unit.id },
          data: { locationIndex: capital.mapIndex },
        });
      }
      io.to(battle.matchId).emit("battle:unit_fled", {
        battleId,
        battleUnitId,
      });
    } catch (err) {
      console.error("[BATTLE] action_flee error:", err);
      socket.emit("error", { message: "Erro em Fuga" });
    }
  });

  // Ajuda: aplica HELP_NEXT na unidade adjacente
  socket.on(
    "battle:action_help",
    async ({ battleId, fromBattleUnitId, toBattleUnitId }) => {
      try {
        const from = await prisma.battleUnit.findUnique({
          where: { id: fromBattleUnitId },
        });
        const to = await prisma.battleUnit.findUnique({
          where: { id: toBattleUnitId },
        });
        if (!from || !to)
          return socket.emit("error", { message: "Unidades inválidas" });
        const manhattan =
          Math.abs(from.posX - to.posX) + Math.abs(from.posY - to.posY);
        if (manhattan !== 1)
          return socket.emit("error", { message: "Alvo deve estar adjacente" });
        const conds = JSON.parse(to.conditions || "[]");
        if (!conds.includes("HELP_NEXT")) conds.push("HELP_NEXT");
        await prisma.battleUnit.update({
          where: { id: to.id },
          data: { conditions: JSON.stringify(conds) },
        });
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_HELP",
            payload: JSON.stringify({ fromBattleUnitId, toBattleUnitId }),
          },
        });
        socket.emit("battle:help_applied", { battleId, toBattleUnitId });
      } catch (err) {
        console.error("[BATTLE] action_help error:", err);
        socket.emit("error", { message: "Erro em Ajuda" });
      }
    }
  );

  // Desarmar: resistido combate vs acuidade; aplica DISARMED
  socket.on(
    "battle:action_disarm",
    async ({ battleId, attackerBattleUnitId, targetBattleUnitId }) => {
      try {
        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !targetBU)
          return socket.emit("error", { message: "Unidades inválidas" });
        const attacker = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const defender = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attacker || !defender) return;
        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "O alvo deve estar adjacente",
          });
        const atkRolls = rollD6(attacker.combat);
        const atkSucc = countSuccesses(atkRolls, 4);
        const defRolls = rollD6(defender.acuity);
        const defSucc = countSuccesses(defRolls, 4);
        const success = atkSucc > defSucc;
        if (success) {
          const conds = JSON.parse(targetBU.conditions || "[]");
          if (!conds.includes("DISARMED")) conds.push("DISARMED");
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { conditions: JSON.stringify(conds) },
          });
        }
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_DISARM",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              atkRolls,
              defRolls,
              success,
            }),
          },
        });
        socket.emit("battle:disarm_result", {
          battleId,
          targetBattleUnitId,
          success,
        });
      } catch (err) {
        console.error("[BATTLE] action_disarm error:", err);
        socket.emit("error", { message: "Erro em Desarmar" });
      }
    }
  );

  // Arremessar: teste Combate CS:4; empurra em direção, dano físico nos envolvidos igual aos sucessos
  socket.on(
    "battle:action_throw",
    async ({
      battleId,
      attackerBattleUnitId,
      targetBattleUnitId,
      dirX,
      dirY,
    }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle) return;
        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !targetBU)
          return socket.emit("error", { message: "Unidades inválidas" });
        const attacker = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const targetUnit = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attacker || !targetUnit) return;
        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "O alvo deve estar adjacente",
          });

        // direction normalize to -1,0,1
        const dx = Math.sign(dirX || 0);
        const dy = Math.sign(dirY || 0);
        if (dx === 0 && dy === 0)
          return socket.emit("error", { message: "Direção inválida" });

        const rolls = rollD6(attacker.combat);
        const successes = countSuccesses(rolls, 4);
        let steps = successes;
        let finalX = targetBU.posX;
        let finalY = targetBU.posY;
        let collided = false;
        while (steps > 0) {
          const nx = finalX + dx;
          const ny = finalY + dy;
          // bounds
          if (
            nx < 0 ||
            ny < 0 ||
            nx >= battle.gridWidth ||
            ny >= battle.gridHeight
          ) {
            collided = true;
            break;
          }
          // obstacle or unit
          const aliveAt = await prisma.battleUnit.findFirst({
            where: { battleId, posX: nx, posY: ny, isAlive: true },
          });
          const corpseAt = await prisma.battleUnit.findFirst({
            where: { battleId, posX: nx, posY: ny, isAlive: false },
          });
          const corpseRemoved = corpseAt
            ? JSON.parse(corpseAt.conditions || "[]").includes("CORPSE_REMOVED")
            : true;
          if (aliveAt || (corpseAt && !corpseRemoved)) {
            collided = true;
            break;
          }
          finalX = nx;
          finalY = ny;
          steps--;
        }

        // move target
        await prisma.battleUnit.update({
          where: { id: targetBU.id },
          data: { posX: finalX, posY: finalY },
        });

        // on collision or hitting ground, apply physical damage equal to successes to both
        if (successes > 0) {
          const attackerResolved = applyProtectionDamage(
            attackerBU.protection || 0,
            !!attackerBU.protectionBroken,
            attacker.currentHp,
            successes,
            "FISICO"
          );
          const targetResolved = applyProtectionDamage(
            targetBU.protection || 0,
            !!targetBU.protectionBroken,
            targetUnit.currentHp,
            successes,
            "FISICO"
          );
          await prisma.battleUnit.update({
            where: { id: attackerBU.id },
            data: {
              protection: attackerResolved.newProtection,
              protectionBroken: attackerResolved.newProtectionBroken,
            },
          });
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: {
              protection: targetResolved.newProtection,
              protectionBroken: targetResolved.newProtectionBroken,
            },
          });
          if (attackerResolved.newHp !== attacker.currentHp)
            await prisma.unit.update({
              where: { id: attacker.id },
              data: { currentHp: attackerResolved.newHp },
            });
          if (targetResolved.newHp !== targetUnit.currentHp)
            await prisma.unit.update({
              where: { id: targetUnit.id },
              data: { currentHp: targetResolved.newHp },
            });
        }

        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_THROW",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              dirX: dx,
              dirY: dy,
              rolls,
              successes,
              collided,
            }),
          },
        });
        io.to(battle.matchId).emit("battle:unit_thrown", {
          battleId,
          attackerBattleUnitId,
          targetBattleUnitId,
          toX: finalX,
          toY: finalY,
          successes,
        });
      } catch (err) {
        console.error("[BATTLE] action_throw error:", err);
        socket.emit("error", { message: "Erro em Arremessar" });
      }
    }
  );

  // Proteger-se: reduz próximo dano em 5; uma vez por batalha
  socket.on("battle:action_protect", async ({ battleId, battleUnitId }) => {
    try {
      const bu = await prisma.battleUnit.findUnique({
        where: { id: battleUnitId },
      });
      if (!bu) return;
      const conds = JSON.parse(bu.conditions || "[]");
      if (conds.includes("PROTECT_USED"))
        return socket.emit("error", {
          message: "Já usou Proteger-se nesta batalha",
        });
      if (!conds.includes("PROTECTED")) conds.push("PROTECTED");
      conds.push("PROTECT_USED");
      await prisma.battleUnit.update({
        where: { id: bu.id },
        data: { conditions: JSON.stringify(conds) },
      });
      await prisma.battleLog.create({
        data: {
          battleId,
          type: "ACTION_PROTECT",
          payload: JSON.stringify({ battleUnitId }),
        },
      });
      socket.emit("battle:protected", { battleId, battleUnitId });
    } catch (err) {
      console.error("[BATTLE] action_protect error:", err);
      socket.emit("error", { message: "Erro em Proteger-se" });
    }
  });

  // Derrubar: combate resistido contra acuidade; aplica DERRUBADA
  socket.on(
    "battle:action_knockdown",
    async ({ battleId, attackerBattleUnitId, targetBattleUnitId }) => {
      try {
        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !targetBU) return;
        const attacker = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const defender = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attacker || !defender) return;
        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "O alvo deve estar adjacente",
          });
        const atkRolls = rollD6(attacker.combat);
        const atkSucc = countSuccesses(atkRolls, 4);
        const defRolls = rollD6(defender.acuity);
        const defSucc = countSuccesses(defRolls, 4);
        const success = atkSucc > defSucc;
        if (success) {
          const conds = JSON.parse(targetBU.conditions || "[]");
          if (!conds.includes("DERRUBADA")) conds.push("DERRUBADA");
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: { conditions: JSON.stringify(conds) },
          });
        }
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_KNOCKDOWN",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              atkRolls,
              defRolls,
              success,
            }),
          },
        });
        socket.emit("battle:knockdown_result", {
          battleId,
          targetBattleUnitId,
          success,
        });
      } catch (err) {
        console.error("[BATTLE] action_knockdown error:", err);
        socket.emit("error", { message: "Erro em Derrubar" });
      }
    }
  );

  // Agarrar: combate resistido contra acuidade; ambos ficam AGARRADO e referenciados
  socket.on(
    "battle:action_grab",
    async ({ battleId, attackerBattleUnitId, targetBattleUnitId }) => {
      try {
        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        const targetBU = await prisma.battleUnit.findUnique({
          where: { id: targetBattleUnitId },
        });
        if (!attackerBU || !targetBU) return;
        const attacker = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        const defender = await prisma.unit.findUnique({
          where: { id: targetBU.unitId },
        });
        if (!attacker || !defender) return;
        const manhattan =
          Math.abs(attackerBU.posX - targetBU.posX) +
          Math.abs(attackerBU.posY - targetBU.posY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "O alvo deve estar adjacente",
          });
        const atkRolls = rollD6(attacker.combat);
        const atkSucc = countSuccesses(atkRolls, 4);
        const defRolls = rollD6(defender.acuity);
        const defSucc = countSuccesses(defRolls, 4);
        const success = atkSucc > defSucc;
        if (success) {
          const atkConds = JSON.parse(attackerBU.conditions || "[]");
          const defConds = JSON.parse(targetBU.conditions || "[]");
          if (!atkConds.includes("AGARRADO")) atkConds.push("AGARRADO");
          if (!defConds.includes("AGARRADO")) defConds.push("AGARRADO");
          await prisma.battleUnit.update({
            where: { id: attackerBU.id },
            data: {
              conditions: JSON.stringify(atkConds),
              grabbedByBattleUnitId: targetBU.id,
            },
          });
          await prisma.battleUnit.update({
            where: { id: targetBU.id },
            data: {
              conditions: JSON.stringify(defConds),
              grabbedByBattleUnitId: attackerBU.id,
            },
          });
        }
        await prisma.battleLog.create({
          data: {
            battleId,
            type: "ACTION_GRAB",
            payload: JSON.stringify({
              attackerBattleUnitId,
              targetBattleUnitId,
              atkRolls,
              defRolls,
              success,
            }),
          },
        });
        io.to(
          (await prisma.battle.findUnique({ where: { id: battleId } }))!.matchId
        ).emit("battle:grab_result", {
          battleId,
          attackerBattleUnitId,
          targetBattleUnitId,
          success,
        });
      } catch (err) {
        console.error("[BATTLE] action_grab error:", err);
        socket.emit("error", { message: "Erro em Agarrar" });
      }
    }
  );

  // Atacar obstáculo: cadáver ou objeto; se dano >= 5, remove obstáculo (cadáver)
  socket.on(
    "battle:attack_obstacle",
    async ({
      battleId,
      attackerBattleUnitId,
      targetX,
      targetY,
      damageType = "FISICO",
    }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle || battle.status !== "ACTIVE")
          return socket.emit("error", { message: "Batalha inválida" });

        const attackerBU = await prisma.battleUnit.findUnique({
          where: { id: attackerBattleUnitId },
        });
        if (!attackerBU || !attackerBU.isAlive)
          return socket.emit("error", { message: "Atacante inválido" });
        if (attackerBU.actionsLeft <= 0)
          return socket.emit("error", { message: "Sem ações restantes" });

        const manhattan =
          Math.abs(attackerBU.posX - targetX) +
          Math.abs(attackerBU.posY - targetY);
        if (manhattan !== 1)
          return socket.emit("error", {
            message: "Obstáculo deve estar adjacente",
          });

        // Cadáver como obstáculo
        const corpse = await prisma.battleUnit.findFirst({
          where: {
            battleId: battle.id,
            posX: targetX,
            posY: targetY,
            isAlive: false,
          },
        });

        // Dano básico contra obstáculo usa Combate do atacante
        const attackerUnit = await prisma.unit.findUnique({
          where: { id: attackerBU.unitId },
        });
        if (!attackerUnit)
          return socket.emit("error", { message: "Unidade atacante inválida" });
        const damage = Math.max(1, attackerUnit.combat); // Obstáculo não tem armadura

        // Consome ação
        await prisma.battleUnit.update({
          where: { id: attackerBU.id },
          data: { actionsLeft: Math.max(0, attackerBU.actionsLeft - 1) },
        });

        if (corpse && damage >= 5) {
          const cConds = JSON.parse(corpse.conditions || "[]");
          if (!cConds.includes("CORPSE_REMOVED")) cConds.push("CORPSE_REMOVED");
          await prisma.battleUnit.update({
            where: { id: corpse.id },
            data: { conditions: JSON.stringify(cConds) },
          });
          await prisma.battleLog.create({
            data: {
              battleId: battle.id,
              type: "OBSTACLE_DESTROYED",
              payload: JSON.stringify({
                x: targetX,
                y: targetY,
                damage,
                damageType,
              }),
            },
          });
          io.to(battle.matchId).emit("battle:obstacle_destroyed", {
            battleId,
            x: targetX,
            y: targetY,
          });
          return;
        }

        // Obstáculo não destruído: apenas log do ataque
        await prisma.battleLog.create({
          data: {
            battleId: battle.id,
            type: "OBSTACLE_HIT",
            payload: JSON.stringify({
              x: targetX,
              y: targetY,
              damage,
              damageType,
            }),
          },
        });
        socket.emit("battle:obstacle_intact", {
          battleId,
          x: targetX,
          y: targetY,
        });
      } catch (err) {
        console.error("[BATTLE] attack_obstacle error:", err);
        socket.emit("error", { message: "Erro ao atacar obstáculo" });
      }
    }
  );

  // Finalizar unidade: matar ou render
  socket.on(
    "battle:finalize_unit",
    async ({ battleId, battleUnitId, choice }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle) return;
        const bu = await prisma.battleUnit.findUnique({
          where: { id: battleUnitId },
        });
        if (!bu) return;
        const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
        if (!unit) return;

        if (choice === "KILL") {
          await prisma.battleUnit.update({
            where: { id: bu.id },
            data: { isAlive: false },
          });
          io.to(battle.matchId).emit("battle:unit_killed", {
            battleId,
            battleUnitId,
          });
          // Cascade kill of summons
          const unit = await prisma.unit.findUnique({
            where: { id: bu.unitId },
          });
          if (unit) {
            const summons = await prisma.unit.findMany({
              where: { summonerId: unit.id, matchId: battle.matchId },
            });
            for (const s of summons) {
              const sBU = await prisma.battleUnit.findFirst({
                where: { battleId: battle.id, unitId: s.id },
              });
              if (sBU) {
                await prisma.battleUnit.update({
                  where: { id: sBU.id },
                  data: { isAlive: false },
                });
                await prisma.battleLog.create({
                  data: {
                    battleId: battle.id,
                    type: "SUMMON_CASCADE_KILL",
                    payload: JSON.stringify({
                      parentUnitId: unit.id,
                      summonUnitId: s.id,
                    }),
                  },
                });
              }
              if (s.currentHp > 0) {
                await prisma.unit.update({
                  where: { id: s.id },
                  data: { currentHp: 0 },
                });
              }
            }
          }
        } else if (choice === "SURRENDER") {
          const conditions = JSON.parse(bu.conditions || "[]");
          if (!conditions.includes("DESABILITADA"))
            conditions.push("DESABILITADA");
          await prisma.battleUnit.update({
            where: { id: bu.id },
            data: { conditions: JSON.stringify(conditions) },
          });
          io.to(battle.matchId).emit("battle:unit_surrendered", {
            battleId,
            battleUnitId,
          });
        } else {
          return socket.emit("error", { message: "Escolha inválida" });
        }
      } catch (err) {
        console.error("[BATTLE] finalize_unit error:", err);
        socket.emit("error", { message: "Erro ao finalizar unidade" });
      }
    }
  );

  // Definir resgate ao fim da batalha
  socket.on(
    "battle:set_ransom",
    async ({ battleId, playerId, ransomPrice, ransomResource }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle) return;
        const player = await prisma.matchPlayer.findUnique({
          where: { id: playerId },
        });
        if (!player) return;

        const res = JSON.parse(player.resources);
        if ((res.devocao || 0) < ransomPrice) {
          return socket.emit("error", { message: "Devoção insuficiente" });
        }
        res.devocao = (res.devocao || 0) - ransomPrice;
        await prisma.matchPlayer.update({
          where: { id: playerId },
          data: { resources: JSON.stringify(res) },
        });

        await prisma.battle.update({
          where: { id: battle.id },
          data: { ransomPrice, ransomResource },
        });
        io.to(battle.matchId).emit("battle:ransom_set", {
          battleId,
          ransomPrice,
          ransomResource,
        });
      } catch (err) {
        console.error("[BATTLE] set_ransom error:", err);
        socket.emit("error", { message: "Erro ao definir resgate" });
      }
    }
  );

  // Pagar resgate por uma unidade rendida
  socket.on(
    "battle:pay_ransom",
    async ({ battleId, playerId, battleUnitId }) => {
      try {
        const battle = await prisma.battle.findUnique({
          where: { id: battleId },
        });
        if (!battle || battle.status !== "ENDED")
          return socket.emit("error", { message: "Batalha não encerrada" });
        if (!battle.ransomPrice || !battle.ransomResource)
          return socket.emit("error", { message: "Resgate não definido" });

        const bu = await prisma.battleUnit.findUnique({
          where: { id: battleUnitId },
        });
        if (!bu) return;
        if (bu.ownerId !== playerId)
          return socket.emit("error", {
            message: "Você não controla esta unidade",
          });
        const unit = await prisma.unit.findUnique({ where: { id: bu.unitId } });
        if (!unit) return;

        const conditions = JSON.parse(bu.conditions || "[]");
        if (!conditions.includes("DESABILITADA"))
          return socket.emit("error", { message: "Unidade não está rendida" });

        const player = await prisma.matchPlayer.findUnique({
          where: { id: playerId },
        });
        const res = JSON.parse(player!.resources);
        const key = battle.ransomResource as string;
        if ((res[key] || 0) < battle.ransomPrice!) {
          return socket.emit("error", {
            message: "Recursos insuficientes para resgate",
          });
        }
        res[key] = (res[key] || 0) - battle.ransomPrice!;
        await prisma.matchPlayer.update({
          where: { id: playerId },
          data: { resources: JSON.stringify(res) },
        });

        // Remove desabilitada
        const newConds = conditions.filter((c: string) => c !== "DESABILITADA");
        await prisma.battleUnit.update({
          where: { id: bu.id },
          data: { conditions: JSON.stringify(newConds) },
        });
        io.to(battle.matchId).emit("battle:ransom_paid", {
          battleId,
          battleUnitId,
        });
      } catch (err) {
        console.error("[BATTLE] pay_ransom error:", err);
        socket.emit("error", { message: "Erro ao pagar resgate" });
      }
    }
  );

  // Converter unidades rendidas não pagas em prisioneiros
  socket.on("battle:resolve_ransom", async ({ battleId }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle || battle.status !== "ENDED") return;
      const bus = await prisma.battleUnit.findMany({
        where: { battleId: battle.id },
      });
      for (const bu of bus) {
        const conditions = JSON.parse(bu.conditions || "[]");
        if (conditions.includes("DESABILITADA")) {
          await prisma.unit.update({
            where: { id: bu.unitId },
            data: { category: "PRISIONEIRO" },
          });
        }
      }
      io.to(battle.matchId).emit("battle:ransom_resolved", { battleId });
    } catch (err) {
      console.error("[BATTLE] resolve_ransom error:", err);
      socket.emit("error", { message: "Erro ao resolver resgate" });
    }
  });

  // Finalizar turno atual e avançar na ordem de iniciativa
  socket.on("battle:end_turn", async ({ battleId }) => {
    try {
      const battle = await prisma.battle.findUnique({
        where: { id: battleId },
      });
      if (!battle) return;
      const order = JSON.parse(battle.initiativeOrder) as string[];
      if (!order.length) return;

      const nextIndex = (battle.currentTurnIndex + 1) % order.length;
      await prisma.battle.update({
        where: { id: battle.id },
        data: { currentTurnIndex: nextIndex },
      });

      const nextBuId = order[nextIndex];
      await prisma.battleUnit.update({
        where: { id: nextBuId },
        data: { movesLeft: 3, actionsLeft: 1 },
      });

      await prisma.battleLog.create({
        data: { battleId: battle.id, type: "END_TURN", payload: "{}" },
      });

      io.to(battle.matchId).emit("battle:turn_changed", {
        battleId,
        currentTurnIndex: nextIndex,
        activeBattleUnitId: nextBuId,
      });
    } catch (err) {
      console.error("[BATTLE] end_turn error:", err);
      socket.emit("error", { message: "Erro ao finalizar turno" });
    }
  });
};
