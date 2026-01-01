import { Server, Socket } from "socket.io";
import type { BattleObstacle } from "../../../../shared/types/battle.types";
import {
  executeAttackAction,
  executeDashAction,
  executeDodgeAction,
  executeMoveAction,
  type CombatUnit,
} from "../../logic/combat-actions";
import {
  getEffectiveAcuityWithConditions,
  getMaxMarksByCategory,
} from "../../utils/battle.utils";
import {
  activeBattles,
  battleLobbies,
  battleDiceModalPaused,
  userToLobby,
} from "./battle-state";
import {
  deleteBattleFromDB,
  deleteLobbyFromDB,
  saveBattleToDB,
  updateUserStats,
} from "./battle-persistence";
import { startBattleTurnTimer, stopBattleTurnTimer } from "./battle-timer";
import { generateId } from "./battle-types";

export function registerBattleActionHandlers(io: Server, socket: Socket): void {
  socket.on("battle:dice_modal_open", ({ battleId }) => {
    if (!battleId) return;
    battleDiceModalPaused.set(battleId, true);
    console.log(
      `[ARENA] Timer pausado - modal de dice aberto na batalha ${battleId}`
    );
  });

  socket.on("battle:dice_modal_close", ({ battleId }) => {
    if (!battleId) return;
    battleDiceModalPaused.delete(battleId);
    console.log(
      `[ARENA] Timer retomado - modal de dice fechado na batalha ${battleId}`
    );
  });

  socket.on("battle:begin_action", async ({ battleId, unitId, userId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle) {
        return socket.emit("battle:error", {
          message: "Batalha não encontrada",
        });
      }

      if (battle.actionOrder.length) {
        const currentPlayerId = battle.actionOrder[battle.currentTurnIndex];
        if (currentPlayerId !== userId) {
          return socket.emit("battle:error", {
            message: "Não é sua vez de agir",
          });
        }
      }

      if (battle.activeUnitId && battle.activeUnitId !== unitId) {
        return socket.emit("battle:error", {
          message: "Você já escolheu uma unidade para este turno",
        });
      }

      const unit = battle.units.find((u) => u.id === unitId);
      if (!unit || !unit.isAlive) {
        return socket.emit("battle:error", { message: "Unidade inválida" });
      }
      if (unit.ownerId !== userId) {
        return socket.emit("battle:error", {
          message: "Você não controla esta unidade",
        });
      }

      if (unit.conditions.includes("DESABILITADA")) {
        return socket.emit("battle:error", {
          message: "Unidade desabilitada",
        });
      }

      const maxMarks = getMaxMarksByCategory(unit.category);

      if (!battle.isArena && unit.actionMarks >= maxMarks) {
        return socket.emit("battle:error", {
          message: "Marcas de ação atingidas - unidade exausta",
        });
      }

      if (unit.hasStartedAction) {
        socket.emit("battle:action_started", {
          battleId,
          unitId,
          movesLeft: unit.movesLeft,
          actionsLeft: unit.actionsLeft,
        });
        return;
      }

      const effectiveAcuity = getEffectiveAcuityWithConditions(
        unit.acuity,
        unit.conditions
      );
      unit.movesLeft = effectiveAcuity;

      if (battle.isArena && unit.actionMarks >= maxMarks) {
        unit.actionsLeft = 2;
        unit.currentHp = Math.max(0, unit.currentHp - 5);
        unit.actionMarks = 0;

        if (unit.currentHp <= 0) {
          unit.isAlive = false;
        }
      } else {
        unit.actionsLeft = 1;
      }
      unit.hasStartedAction = true;
      battle.activeUnitId = unitId;

      socket.emit("battle:action_started", {
        battleId,
        unitId,
        movesLeft: effectiveAcuity,
        actionsLeft: unit.actionsLeft,
        currentHp: unit.currentHp,
        isAlive: unit.isAlive,
        actionMarks: unit.actionMarks,
      });

      await saveBattleToDB(battle);
    } catch (err) {
      console.error("[ARENA] begin_action error:", err);
      socket.emit("battle:error", { message: "Erro ao iniciar ação" });
    }
  });

  socket.on("battle:end_unit_action", async ({ battleId, unitId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle) {
        console.error(
          `[ARENA] end_unit_action: Batalha ${battleId} não encontrada`
        );
        return;
      }

      const unit = battle.units.find((u) => u.id === unitId);
      if (!unit) {
        console.error(
          `[ARENA] end_unit_action: Unidade ${unitId} não encontrada`
        );
        return;
      }

      const currentPlayerId = battle.actionOrder[battle.currentTurnIndex];
      if (unit.ownerId !== currentPlayerId) {
        console.warn(
          `[ARENA] end_unit_action: Não é o turno do jogador ${unit.ownerId} (turno atual: ${currentPlayerId})`
        );
        return socket.emit("battle:error", { message: "Não é seu turno" });
      }

      console.log(
        `[ARENA] end_unit_action: ${unit.name} (${unitId}) finalizando turno`
      );

      if (unit.conditions.includes("QUEIMANDO")) {
        unit.currentHp = Math.max(0, unit.currentHp - 2);
        if (unit.currentHp <= 0) {
          unit.isAlive = false;
        }
      }

      unit.conditions = unit.conditions.filter(
        (c) => c !== "DERRUBADA" && c !== "DODGING"
      );

      const maxMarks = getMaxMarksByCategory(unit.category);
      unit.actionMarks = Math.min(maxMarks, unit.actionMarks + 1);
      unit.movesLeft = 0;
      unit.actionsLeft = 0;
      unit.hasStartedAction = false;

      const currentActionsCount =
        battle.roundActionsCount.get(currentPlayerId) || 0;
      battle.roundActionsCount.set(currentPlayerId, currentActionsCount + 1);

      battle.activeUnitId = undefined;
      const oldTurnIndex = battle.currentTurnIndex;
      if (battle.actionOrder.length) {
        battle.currentTurnIndex =
          (battle.currentTurnIndex + 1) % battle.actionOrder.length;
      }

      const newPlayerId = battle.actionOrder[battle.currentTurnIndex];
      console.log(
        `[ARENA] Turno avançado: index ${oldTurnIndex} -> ${battle.currentTurnIndex}, próximo jogador: ${newPlayerId}`
      );

      const lobby = battleLobbies.get(battle.lobbyId);
      if (lobby) {
        io.to(lobby.lobbyId).emit("battle:unit_turn_ended", {
          battleId,
          unitId,
          actionMarks: unit.actionMarks,
          currentHp: unit.currentHp,
          isAlive: unit.isAlive,
          conditions: unit.conditions,
        });

        io.to(lobby.lobbyId).emit("battle:next_player", {
          battleId,
          currentPlayerId: newPlayerId,
          index: battle.currentTurnIndex,
          round: battle.round,
        });

        console.log(
          `[ARENA] Evento battle:next_player emitido para lobby ${lobby.lobbyId}`
        );
      } else {
        console.error(`[ARENA] Lobby não encontrado para batalha ${battleId}`);
      }

      const allPlayersActed = battle.actionOrder.every(
        (playerId) => (battle.roundActionsCount.get(playerId) || 0) >= 1
      );

      if (allPlayersActed) {
        battle.round++;
        for (const playerId of battle.actionOrder) {
          battle.roundActionsCount.set(playerId, 0);
        }
        if (lobby) {
          io.to(lobby.lobbyId).emit("battle:new_round", {
            battleId,
            round: battle.round,
          });
          io.to(lobby.lobbyId).emit("battle:next_player", {
            battleId,
            currentPlayerId: newPlayerId,
            index: battle.currentTurnIndex,
            round: battle.round,
          });
          console.log(
            `[ARENA] Nova rodada ${battle.round} - Re-emitido battle:next_player com round atualizado`
          );
        }
      }

      if (!battle.isArena && lobby) {
        const allUnitsExhausted = battle.units
          .filter((u) => u.isAlive)
          .every((u) => {
            const maxMarks = getMaxMarksByCategory(u.category);
            return u.actionMarks >= maxMarks;
          });

        if (allUnitsExhausted) {
          battle.status = "ENDED";
          stopBattleTurnTimer(battle.id);

          const hpByPlayer = new Map<string, number>();
          for (const u of battle.units) {
            if (u.isAlive) {
              const currentHp = hpByPlayer.get(u.ownerId) || 0;
              hpByPlayer.set(u.ownerId, currentHp + u.currentHp);
            }
          }

          let winnerId: string | null = null;
          let maxHp = -1;
          for (const [playerId, totalHp] of hpByPlayer.entries()) {
            if (totalHp > maxHp) {
              maxHp = totalHp;
              winnerId = playerId;
            }
          }

          const winnerKingdom = battle.units.find(
            (u) => u.ownerId === winnerId
          )?.ownerKingdomId;

          io.to(lobby.lobbyId).emit("battle:battle_ended", {
            battleId,
            winnerId,
            winnerKingdomId: winnerKingdom,
            reason: "Todas as unidades estão exaustas (3 Action Marks)",
            finalUnits: battle.units,
          });

          const loserId =
            winnerId === lobby.hostUserId
              ? lobby.guestUserId
              : lobby.hostUserId;
          await updateUserStats(winnerId, loserId, battle.isArena);

          userToLobby.delete(lobby.hostUserId);
          if (lobby.guestUserId) {
            userToLobby.delete(lobby.guestUserId);
          }

          lobby.status = "ENDED";
          await deleteBattleFromDB(battleId);
          await deleteLobbyFromDB(lobby.lobbyId);
          console.log(
            `[BATTLE] Batalha ${battleId} finalizada por exaustão. Vencedor: ${winnerId}`
          );

          return;
        }
      }

      startBattleTurnTimer(battle);
      await saveBattleToDB(battle);
    } catch (err) {
      console.error("[ARENA] end_unit_action error:", err);
    }
  });

  socket.on("battle:move", async ({ battleId, unitId, toX, toY }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle || battle.status !== "ACTIVE") {
        return socket.emit("battle:error", { message: "Batalha inválida" });
      }

      const unit = battle.units.find((u) => u.id === unitId);
      if (!unit || !unit.isAlive) {
        return socket.emit("battle:error", { message: "Unidade inválida" });
      }

      const result = executeMoveAction(
        unit as CombatUnit,
        toX,
        toY,
        battle.gridWidth,
        battle.gridHeight,
        battle.units as CombatUnit[],
        battle.config.map.obstacles || []
      );

      if (!result.success) {
        return socket.emit("battle:error", { message: result.error });
      }

      battle.logs.push({
        id: generateId(),
        timestamp: new Date(),
        type: "MOVE",
        payload: {
          unitId,
          from: [result.fromX, result.fromY],
          to: [result.toX, result.toY],
        },
      });

      const lobby = battleLobbies.get(battle.lobbyId);
      if (lobby) {
        io.to(lobby.lobbyId).emit("battle:unit_moved", {
          battleId,
          unitId,
          fromX: result.fromX,
          fromY: result.fromY,
          toX: result.toX,
          toY: result.toY,
          movesLeft: result.movesLeft,
        });
      }

      await saveBattleToDB(battle);
    } catch (err) {
      console.error("[ARENA] move error:", err);
      socket.emit("battle:error", { message: "Erro ao mover" });
    }
  });

  socket.on(
    "battle:attack",
    async ({
      battleId,
      attackerUnitId,
      targetUnitId,
      targetObstacleId,
      damageType = "FISICO",
    }) => {
      try {
        const battle = activeBattles.get(battleId);
        if (!battle || battle.status !== "ACTIVE") {
          return socket.emit("battle:error", { message: "Batalha inválida" });
        }

        const attacker = battle.units.find((u) => u.id === attackerUnitId);
        if (!attacker || !attacker.isAlive) {
          return socket.emit("battle:error", { message: "Atacante inválido" });
        }

        let target: (typeof battle.units)[number] | undefined = undefined;
        let obstacle: BattleObstacle | undefined = undefined;

        if (targetUnitId) {
          target = battle.units.find((u) => u.id === targetUnitId);
          if (!target) {
            return socket.emit("battle:error", { message: "Alvo inválido" });
          }
        } else if (targetObstacleId) {
          obstacle = battle.config.map?.obstacles?.find(
            (o) => o.id === targetObstacleId
          );
          if (!obstacle) {
            return socket.emit("battle:error", {
              message: "Obstáculo não encontrado",
            });
          }
          if (obstacle.destroyed) {
            return socket.emit("battle:error", {
              message: "Obstáculo já destruído",
            });
          }
        } else {
          return socket.emit("battle:error", {
            message: "Nenhum alvo especificado",
          });
        }

        const result = executeAttackAction(
          attacker as CombatUnit,
          target as CombatUnit | null,
          damageType,
          obstacle
        );

        if (!result.success) {
          return socket.emit("battle:error", { message: result.error });
        }

        const logType = result.obstacleDestroyed
          ? "ATTACK_OBSTACLE_DESTROY"
          : result.targetDefeated
          ? "ATTACK_KILL"
          : "ATTACK";

        battle.logs.push({
          id: generateId(),
          timestamp: new Date(),
          type: logType,
          payload: {
            attackerUnitId,
            targetUnitId: targetUnitId || null,
            targetObstacleId: targetObstacleId || null,
            targetType: result.targetType,
            diceCount: result.diceCount,
            rolls: result.rolls,
            damage: result.finalDamage,
            damageType: result.damageType,
            targetHpAfter: result.targetHpAfter,
          },
        });

        const lobby = battleLobbies.get(battle.lobbyId);
        if (lobby) {
          io.to(lobby.lobbyId).emit("battle:unit_attacked", {
            battleId,
            attackerUnitId,
            targetUnitId: targetUnitId || null,
            targetObstacleId: targetObstacleId || null,
            targetType: result.targetType,
            diceCount: result.diceCount,
            rolls: result.rolls,
            damage: result.finalDamage,
            damageType: result.damageType,
            targetHpAfter: result.targetHpAfter,
            targetProtection: result.targetProtection,
            attackerActionsLeft: attacker.actionsLeft,
            missed: result.missed ?? false,
            attackDiceCount: result.attackDiceCount ?? 0,
            attackRolls: result.attackRolls ?? [],
            attackSuccesses: result.attackSuccesses ?? 0,
            rawDamage: result.rawDamage ?? 0,
            defenseDiceCount: result.defenseDiceCount ?? 0,
            defenseRolls: result.defenseRolls ?? [],
            defenseSuccesses: result.defenseSuccesses ?? 0,
            damageReduction: result.damageReduction ?? 0,
            finalDamage: result.finalDamage ?? 0,
            targetPhysicalProtection: result.targetPhysicalProtection ?? 0,
            targetMagicalProtection: result.targetMagicalProtection ?? 0,
            targetDefeated: result.targetDefeated ?? false,
            obstacleDestroyed: result.obstacleDestroyed ?? false,
            obstacleId: result.obstacleId ?? null,
            attackerName: attacker.name,
            attackerIcon: "⚔️",
            attackerCombat: attacker.combat,
            targetName: target?.name ?? obstacle?.id ?? "Obstáculo",
            targetIcon: target ? "🛡️" : "🪨",
            targetCombat: target?.combat ?? 0,
            targetAcuity: target?.acuity ?? 0,
          });

          if (result.obstacleDestroyed && result.obstacleId) {
            io.to(lobby.lobbyId).emit("battle:obstacle_destroyed", {
              battleId,
              obstacleId: result.obstacleId,
            });
          }

          if (result.targetDefeated && target) {
            io.to(lobby.lobbyId).emit("battle:unit_defeated", {
              battleId,
              unitId: target.id,
            });

            const aliveBySide = new Map<string, number>();
            for (const u of battle.units) {
              if (u.isAlive) {
                const count = aliveBySide.get(u.ownerId) || 0;
                aliveBySide.set(u.ownerId, count + 1);
              }
            }

            console.log("[ARENA] Verificando vitória:", {
              aliveBySideSize: aliveBySide.size,
              aliveBySide: Object.fromEntries(aliveBySide),
              totalUnits: battle.units.length,
              aliveUnits: battle.units.filter((u) => u.isAlive).length,
            });

            if (aliveBySide.size <= 1) {
              battle.status = "ENDED";
              stopBattleTurnTimer(battle.id);
              const winnerId = aliveBySide.keys().next().value || null;
              const winnerKingdom = battle.units.find(
                (u) => u.ownerId === winnerId
              )?.ownerKingdomId;

              io.to(lobby.lobbyId).emit("battle:battle_ended", {
                battleId,
                winnerId,
                winnerKingdomId: winnerKingdom,
                reason: "Todas as unidades inimigas foram derrotadas",
                finalUnits: battle.units,
              });

              const loserId =
                winnerId === lobby.hostUserId
                  ? lobby.guestUserId
                  : lobby.hostUserId;
              await updateUserStats(winnerId, loserId, battle.isArena);

              userToLobby.delete(lobby.hostUserId);
              if (lobby.guestUserId) {
                userToLobby.delete(lobby.guestUserId);
              }

              lobby.status = "ENDED";
              await deleteBattleFromDB(battleId);
              await deleteLobbyFromDB(lobby.lobbyId);
              console.log(
                `[ARENA] Batalha ${battleId} finalizada. Vencedor: ${winnerId}`
              );
            }
          }
        }

        if (battle.status === "ACTIVE") {
          await saveBattleToDB(battle);
        }
      } catch (err) {
        console.error("[ARENA] attack error:", err);
        socket.emit("battle:error", { message: "Erro ao atacar" });
      }
    }
  );

  socket.on("battle:dash", async ({ battleId, unitId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle || battle.status !== "ACTIVE") {
        return socket.emit("battle:error", { message: "Batalha inválida" });
      }

      const unit = battle.units.find((u) => u.id === unitId);
      if (!unit || !unit.isAlive) {
        return socket.emit("battle:error", { message: "Unidade inválida" });
      }

      const result = executeDashAction(unit as CombatUnit);

      if (!result.success) {
        return socket.emit("battle:error", { message: result.error });
      }

      battle.logs.push({
        id: generateId(),
        timestamp: new Date(),
        type: "DASH",
        payload: { unitId, newMovesLeft: result.newMovesLeft },
      });

      const lobby = battleLobbies.get(battle.lobbyId);
      if (lobby) {
        io.to(lobby.lobbyId).emit("battle:unit_dashed", {
          battleId,
          unitId,
          movesLeft: result.newMovesLeft,
          actionsLeft: unit.actionsLeft,
        });
      }

      await saveBattleToDB(battle);
    } catch (err) {
      console.error("[ARENA] dash error:", err);
      socket.emit("battle:error", { message: "Erro ao disparar" });
    }
  });

  socket.on("battle:dodge", async ({ battleId, unitId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle || battle.status !== "ACTIVE") {
        return socket.emit("battle:error", { message: "Batalha inválida" });
      }

      const unit = battle.units.find((u) => u.id === unitId);
      if (!unit || !unit.isAlive) {
        return socket.emit("battle:error", { message: "Unidade inválida" });
      }

      const result = executeDodgeAction(unit as CombatUnit);

      if (!result.success) {
        return socket.emit("battle:error", { message: result.error });
      }

      battle.logs.push({
        id: generateId(),
        timestamp: new Date(),
        type: "DODGE",
        payload: { unitId },
      });

      const lobby = battleLobbies.get(battle.lobbyId);
      if (lobby) {
        io.to(lobby.lobbyId).emit("battle:unit_dodged", {
          battleId,
          unitId,
          actionsLeft: unit.actionsLeft,
          conditions: unit.conditions,
        });
      }

      await saveBattleToDB(battle);
    } catch (err) {
      console.error("[ARENA] dodge error:", err);
      socket.emit("battle:error", { message: "Erro ao esquivar" });
    }
  });

  socket.on("battle:get_battle_state", async ({ battleId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle) {
        return socket.emit("battle:error", {
          message: "Batalha não encontrada",
        });
      }

      socket.emit("battle:battle_state", {
        battleId,
        config: battle.config,
        round: battle.round,
        status: battle.status,
        currentTurnIndex: battle.currentTurnIndex,
        currentPlayerId: battle.actionOrder[battle.currentTurnIndex],
        actionOrder: battle.actionOrder,
        units: battle.units,
        logs: battle.logs.slice(-20),
      });
    } catch (err) {
      console.error("[ARENA] get_battle_state error:", err);
    }
  });

  socket.on("battle:surrender", async ({ battleId, userId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle || battle.status !== "ACTIVE") {
        return socket.emit("battle:error", {
          message: "Batalha não encontrada",
        });
      }

      const lobby = battleLobbies.get(battle.lobbyId);
      if (!lobby) return;

      const winnerId =
        lobby.hostUserId === userId ? lobby.guestUserId : lobby.hostUserId;

      battle.status = "ENDED";
      lobby.status = "ENDED";
      stopBattleTurnTimer(battle.id);

      userToLobby.delete(lobby.hostUserId);
      if (lobby.guestUserId) {
        userToLobby.delete(lobby.guestUserId);
      }

      await deleteLobbyFromDB(lobby.lobbyId);

      const winnerKingdom = battle.units.find(
        (u) => u.ownerId === winnerId
      )?.ownerKingdomId;

      io.to(lobby.lobbyId).emit("battle:battle_ended", {
        battleId,
        winnerId,
        winnerKingdomId: winnerKingdom,
        reason: "Oponente se rendeu",
        surrenderedBy: userId,
        finalUnits: battle.units,
      });

      await updateUserStats(winnerId, userId, battle.isArena);

      await deleteBattleFromDB(battleId);

      console.log(`[ARENA] ${userId} se rendeu na batalha ${battleId}`);
    } catch (err) {
      console.error("[ARENA] surrender error:", err);
    }
  });

  socket.on("battle:leave_battle", async ({ battleId, userId }) => {
    try {
      const battle = activeBattles.get(battleId);
      if (!battle || battle.status !== "ACTIVE") {
        return socket.emit("battle:error", {
          message: "Batalha não encontrada ou já finalizada",
        });
      }

      const lobby = battleLobbies.get(battle.lobbyId);
      if (!lobby) {
        return socket.emit("battle:error", { message: "Lobby não encontrado" });
      }

      if (lobby.hostUserId !== userId && lobby.guestUserId !== userId) {
        return socket.emit("battle:error", {
          message: "Você não está nesta batalha",
        });
      }

      const winnerId =
        lobby.hostUserId === userId ? lobby.guestUserId : lobby.hostUserId;

      battle.status = "ENDED";
      lobby.status = "ENDED";
      stopBattleTurnTimer(battle.id);

      userToLobby.delete(lobby.hostUserId);
      if (lobby.guestUserId) {
        userToLobby.delete(lobby.guestUserId);
      }

      await deleteLobbyFromDB(lobby.lobbyId);

      io.to(battle.lobbyId).emit("battle:battle_ended", {
        battleId,
        winnerId,
        reason: "Oponente abandonou a batalha",
        abandonedBy: userId,
        finalUnits: battle.units,
      });

      await updateUserStats(winnerId, userId, battle.isArena);

      await deleteBattleFromDB(battleId);

      socket.leave(battle.lobbyId);

      socket.emit("battle:left_battle", {
        message: "Você abandonou a batalha. Derrota!",
      });

      console.log(
        `[ARENA] ${userId} abandonou batalha ${battleId}. Vencedor: ${winnerId}`
      );
    } catch (err) {
      console.error("[ARENA] leave_battle error:", err);
      socket.emit("battle:error", { message: "Erro ao sair da batalha" });
    }
  });
}
