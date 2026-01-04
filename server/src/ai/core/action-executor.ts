// server/src/ai/core/action-executor.ts
// Executor de ações da IA - integra com combat-actions

import type { Server } from "socket.io";
import type { ArenaBattle } from "../../../../shared/types/arena.types";
import type { BattleUnit } from "../../../../shared/types/battle.types";
import type { AIDecision } from "../types/ai.types";
import {
  executeMoveAction,
  executeAttackAction,
} from "../../logic/combat-actions";
import {
  processAITurn,
  aiActionDelay,
  logAIDecision,
  getAIUnits,
} from "./ai-controller";

// Delay padrão entre ações da IA (ms)
const AI_ACTION_DELAY = 600;

function toBattleUnit(unit: BattleUnit): BattleUnit {
  return {
    id: unit.id,
    sourceUnitId: unit.sourceUnitId || unit.id,
    ownerId: unit.ownerId,
    ownerKingdomId: unit.ownerKingdomId,
    name: unit.name,
    avatar: unit.avatar,
    category: unit.category,
    troopSlot: unit.troopSlot,
    level: unit.level || 1,
    race: unit.race || "HUMANOIDE",
    classCode: unit.classCode,
    classFeatures: unit.classFeatures || [],
    equipment: unit.equipment || [],
    spells: unit.spells || [],
    combat: unit.combat,
    speed: unit.speed,
    focus: unit.focus,
    armor: unit.armor,
    vitality: unit.vitality,
    damageReduction: unit.damageReduction,
    currentHp: unit.currentHp,
    maxHp: unit.maxHp,
    posX: unit.posX,
    posY: unit.posY,
    movesLeft: unit.movesLeft,
    actionsLeft: unit.actionsLeft,
    attacksLeftThisTurn: unit.attacksLeftThisTurn,
    isAlive: unit.isAlive,
    actionMarks: unit.actionMarks || 0,
    physicalProtection: unit.physicalProtection,
    maxPhysicalProtection: unit.maxPhysicalProtection,
    magicalProtection: unit.magicalProtection,
    maxMagicalProtection: unit.maxMagicalProtection,
    conditions: unit.conditions,
    hasStartedAction: unit.hasStartedAction || false,
    actions: unit.actions || ["move", "attack", "dash", "dodge", "disengage"],
    grabbedByUnitId: unit.grabbedByUnitId,
    size: unit.size || "NORMAL",
    visionRange: unit.visionRange || 10,
    skillCooldowns: unit.skillCooldowns || {},
    isAIControlled: unit.isAIControlled || false,
  };
}

/**
 * Interface para resultado de execução
 */
export interface AIExecutionResult {
  decision: AIDecision;
  success: boolean;
  error?: string;
  stateChanges?: {
    unitMoved?: {
      unitId: string;
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    };
    unitAttacked?: {
      attackerId: string;
      attackerName: string;
      targetId: string;
      targetName: string;
      rawDamage: number;
      damageReduction: number;
      finalDamage: number;
      damageType: string;
      targetHpAfter: number;
      targetPhysicalProtection: number;
      targetMagicalProtection: number;
      defeated: boolean;
      missed: boolean;
      dodged: boolean;
      dodgeChance: number;
      dodgeRoll: number;
    };
    skillUsed?: { casterId: string; skillCode: string; targetId: string };
  };
}

/**
 * Executa uma decisão de movimento
 */
function executeMove(
  decision: AIDecision,
  battle: ArenaBattle
): AIExecutionResult {
  const unit = battle.units.find((u) => u.id === decision.unitId);
  if (!unit || !unit.isAlive) {
    return {
      decision,
      success: false,
      error: "Unidade não encontrada ou morta",
    };
  }

  if (!decision.targetPosition) {
    return {
      decision,
      success: false,
      error: "Posição de destino não especificada",
    };
  }

  const battleUnits = battle.units.map(toBattleUnit);
  const battleUnit = battleUnits.find((u) => u.id === unit.id)!;
  const obstacles = battle.config.map.obstacles || [];

  const result = executeMoveAction(
    battleUnit,
    decision.targetPosition.x,
    decision.targetPosition.y,
    battle.config.grid.width,
    battle.config.grid.height,
    battleUnits,
    obstacles
  );

  if (result.success) {
    // Atualizar estado da unidade na batalha
    unit.posX = decision.targetPosition.x;
    unit.posY = decision.targetPosition.y;
    unit.movesLeft = result.movesLeft ?? unit.movesLeft - 1;

    return {
      decision,
      success: true,
      stateChanges: {
        unitMoved: {
          unitId: unit.id,
          fromX: result.fromX!,
          fromY: result.fromY!,
          toX: result.toX!,
          toY: result.toY!,
        },
      },
    };
  }

  return { decision, success: false, error: result.error };
}

/**
 * Executa uma decisão de ataque
 */
function executeAttack(
  decision: AIDecision,
  battle: ArenaBattle
): AIExecutionResult {
  const attacker = battle.units.find((u) => u.id === decision.unitId);
  if (!attacker || !attacker.isAlive) {
    return {
      decision,
      success: false,
      error: "Atacante não encontrado ou morto",
    };
  }

  const target = battle.units.find((u) => u.id === decision.targetId);
  if (!target || !target.isAlive) {
    return { decision, success: false, error: "Alvo não encontrado ou morto" };
  }

  const battleUnits = battle.units.map(toBattleUnit);
  const attackerBattle = battleUnits.find((u) => u.id === attacker.id)!;
  const targetBattle = battleUnits.find((u) => u.id === target.id)!;
  const obstacles = battle.config.map.obstacles || [];

  const result = executeAttackAction(
    attackerBattle,
    targetBattle,
    "FISICO",
    undefined,
    battleUnits
  );

  if (result.success) {
    // Atualizar estado do alvo
    target.currentHp = result.targetHpAfter ?? target.currentHp;
    target.physicalProtection =
      result.targetPhysicalProtection ?? target.physicalProtection;
    target.magicalProtection =
      result.targetMagicalProtection ?? target.magicalProtection;
    target.isAlive = !result.targetDefeated;

    // Atualizar ataques restantes do atacante
    attacker.attacksLeftThisTurn = result.attacksLeftThisTurn ?? 0;
    if (attacker.attacksLeftThisTurn <= 0) {
      attacker.actionsLeft = Math.max(0, attacker.actionsLeft - 1);
    }

    return {
      decision,
      success: true,
      stateChanges: {
        unitAttacked: {
          attackerId: attacker.id,
          attackerName: attacker.name,
          targetId: target.id,
          targetName: target.name,
          rawDamage: result.rawDamage ?? 0,
          damageReduction: result.damageReduction ?? 0,
          finalDamage: result.finalDamage ?? 0,
          damageType: result.damageType ?? "FISICO",
          targetHpAfter: result.targetHpAfter ?? target.currentHp,
          targetPhysicalProtection:
            result.targetPhysicalProtection ?? target.physicalProtection,
          targetMagicalProtection:
            result.targetMagicalProtection ?? target.magicalProtection,
          defeated: result.targetDefeated ?? false,
          missed: result.missed ?? false,
          dodged: result.dodged ?? false,
          dodgeChance: result.dodgeChance ?? 0,
          dodgeRoll: result.dodgeRoll ?? 0,
        },
      },
    };
  }

  return { decision, success: false, error: result.error };
}

/**
 * Executa uma decisão de skill
 * TODO: Integrar com sistema de skills quando implementado
 */
function executeSkill(
  decision: AIDecision,
  battle: ArenaBattle
): AIExecutionResult {
  // Por enquanto, skills não estão implementadas para IA
  return {
    decision,
    success: false,
    error: "Sistema de skills da IA ainda não implementado",
  };
}

/**
 * Executa uma única decisão da IA
 */
export function executeAIDecision(
  decision: AIDecision,
  battle: ArenaBattle
): AIExecutionResult {
  switch (decision.type) {
    case "MOVE":
      return executeMove(decision, battle);
    case "ATTACK":
      return executeAttack(decision, battle);
    case "SKILL":
      return executeSkill(decision, battle);
    case "PASS":
      return { decision, success: true };
    default:
      return {
        decision,
        success: false,
        error: "Tipo de decisão desconhecido",
      };
  }
}

/**
 * Executa o turno completo da IA com delays para visualização
 * Emite eventos via Socket.IO para atualizar clientes
 */
export async function executeFullAITurn(
  battle: ArenaBattle,
  io: Server,
  lobbyId: string
): Promise<AIExecutionResult[]> {
  const results: AIExecutionResult[] = [];
  const aiUnits = getAIUnits(battle);

  console.log(`[AI] Executando turno completo - ${aiUnits.length} unidades`);

  // Emitir início do turno da IA
  io.to(lobbyId).emit("battle:ai-turn-start", {
    battleId: battle.battleId,
    aiUnitsCount: aiUnits.length,
  });

  // Processar cada unidade
  for (const unit of aiUnits) {
    // Resetar recursos da unidade para o turno
    unit.movesLeft = Math.max(1, unit.speed);
    unit.actionsLeft = 1;
    unit.attacksLeftThisTurn = 1;

    // Emitir que esta unidade está agindo
    io.to(lobbyId).emit("battle:ai-unit-acting", {
      battleId: battle.battleId,
      unitId: unit.id,
      unitName: unit.name,
    });

    await aiActionDelay(AI_ACTION_DELAY / 2);

    // Loop de ações até a unidade não ter mais o que fazer
    let actionCount = 0;
    const maxActions = 10; // Limite de segurança

    while (actionCount < maxActions) {
      // Processar decisão
      const turnResult = await processAITurn(battle);
      const decision = turnResult.decisions.find((d) => d.unitId === unit.id);

      if (!decision || decision.type === "PASS") {
        break;
      }

      logAIDecision(decision, unit);

      // Executar decisão
      const result = executeAIDecision(decision, battle);
      results.push(result);

      if (result.success) {
        // Emitir ação executada
        io.to(lobbyId).emit("battle:ai-action", {
          battleId: battle.battleId,
          unitId: unit.id,
          action: decision.type,
          targetPosition: decision.targetPosition,
          targetId: decision.targetId,
          skillCode: decision.skillCode,
          reason: decision.reason,
          stateChanges: result.stateChanges,
        });

        // === EMITIR EVENTOS DETALHADOS DE ATAQUE ===
        if (decision.type === "ATTACK" && result.stateChanges?.unitAttacked) {
          const attack = result.stateChanges.unitAttacked;

          // Emitir evento detalhado de ataque (igual ao jogador)
          io.to(lobbyId).emit("battle:unit_attacked", {
            battleId: battle.battleId,
            attackerUnitId: attack.attackerId,
            targetUnitId: attack.targetId,
            targetObstacleId: null,
            targetType: "unit",
            damage: attack.finalDamage,
            damageType: attack.damageType,
            targetHpAfter: attack.targetHpAfter,
            attackerActionsLeft: unit.actionsLeft,
            attackerAttacksLeftThisTurn: unit.attacksLeftThisTurn,
            missed: attack.missed,
            rawDamage: attack.rawDamage,
            damageReduction: attack.damageReduction,
            finalDamage: attack.finalDamage,
            targetPhysicalProtection: attack.targetPhysicalProtection,
            targetMagicalProtection: attack.targetMagicalProtection,
            targetDefeated: attack.defeated,
            obstacleDestroyed: false,
            obstacleId: null,
            attackerName: attack.attackerName,
            attackerIcon: "🤖",
            attackerCombat: unit.combat,
            targetName: attack.targetName,
            targetIcon: "🛡️",
            targetCombat: 0,
            targetSpeed: 0,
            dodgeChance: attack.dodgeChance,
            dodgeRoll: attack.dodgeRoll,
          });

          // === COMBAT TOASTS ===
          // Toast de esquiva
          if (attack.missed && attack.dodged) {
            io.to(lobbyId).emit("battle:toast", {
              battleId: battle.battleId,
              type: "success",
              title: "💨 Esquivou!",
              message: `${attack.targetName} desviou do ataque de ${attack.attackerName}!`,
              duration: 2500,
            });
          }

          // Toast de dano ao alvo
          if (!attack.missed && attack.finalDamage > 0) {
            io.to(lobbyId).emit("battle:toast", {
              battleId: battle.battleId,
              type: "error",
              title: "⚔️ Ataque!",
              message: `${attack.attackerName} causou ${attack.finalDamage} de dano em ${attack.targetName}!`,
              duration: 2000,
            });
          }

          // Toast de derrota
          if (attack.defeated) {
            io.to(lobbyId).emit("battle:toast", {
              battleId: battle.battleId,
              type: "error",
              title: "💀 Derrotado!",
              message: `${attack.targetName} foi derrotado por ${attack.attackerName}!`,
              duration: 3000,
            });
          }
        }

        // Emitir estado atualizado da batalha
        io.to(lobbyId).emit("battle:state-updated", {
          battleId: battle.battleId,
          units: battle.units,
        });
      } else {
        console.log(`[AI] Ação falhou: ${result.error}`);
      }

      await aiActionDelay(AI_ACTION_DELAY);
      actionCount++;

      // Se não tem mais ações ou movimentos, parar
      if (unit.movesLeft <= 0 && unit.actionsLeft <= 0) {
        break;
      }
    }
  }

  // Emitir fim do turno da IA
  io.to(lobbyId).emit("battle:ai-turn-end", {
    battleId: battle.battleId,
    actionsExecuted: results.length,
  });

  console.log(`[AI] Turno completo - ${results.length} ações executadas`);

  return results;
}
