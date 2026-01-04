// server/src/ai/behaviors/tactical.behavior.ts
// Comportamento Tático: Equilibrado, considera posicionamento

import type { SkillDefinition } from "../../../../shared/types/skills.types";
import type {
  AIDecision,
  AIBattleContext,
  AIProfile,
  AISelfAssessment,
} from "../types/ai.types";
import {
  manhattanDistance,
  findBestMoveTowards,
  findBestRetreatPosition,
} from "../core/pathfinding";
import {
  selectBestTarget,
  findNearestEnemy,
  isUnitInDanger,
  countThreatsAtPosition,
} from "../core/target-selection";
import { selectBestSkill } from "../core/skill-evaluator";
import { BattleUnit } from "../../../../shared/types/battle.types";

/**
 * Comportamento Tático
 * - Avalia situação antes de agir
 * - Recua se HP baixo
 * - Prefere posições seguras
 * - Usa skills estrategicamente
 * - Considera proteções e estado próprio
 */
export function makeTacticalDecision(
  unit: BattleUnit,
  context: AIBattleContext & { selfAssessment?: AISelfAssessment },
  profile: AIProfile,
  availableSkills: SkillDefinition[]
): AIDecision {
  try {
    const {
      units,
      obstacles,
      gridSize,
      movesRemaining,
      actionsRemaining,
      selfAssessment,
    } = context;
    const enemies = units.filter(
      (u) => u.isAlive && u.ownerId !== unit.ownerId
    );

    // Verificar se pode atacar (tem ações disponíveis)
    const canAttack = (actionsRemaining ?? unit.actionsLeft ?? 0) > 0;

    console.log(
      `[AI Tactical] ${unit.name} em (${unit.posX}, ${
        unit.posY
      }), movesRemaining=${movesRemaining}, actionsRemaining=${
        actionsRemaining ?? unit.actionsLeft
      }, enemies=${enemies.length}`
    );

    // 1. Verificar se está em perigo (usando self-assessment se disponível)
    const inDanger =
      selfAssessment?.shouldRetreat ||
      isUnitInDanger(unit, units, profile.retreatThreshold);

    if (inDanger && movesRemaining > 0) {
      console.log(`[AI Tactical] ${unit.name} está em perigo, tentando recuar`);
      // Tentar recuar
      const retreatPos = findBestRetreatPosition(
        unit,
        enemies,
        movesRemaining,
        gridSize.width,
        gridSize.height,
        units,
        obstacles
      );

      if (retreatPos) {
        return {
          type: "MOVE",
          unitId: unit.id,
          targetPosition: retreatPos,
          reason: "Tático: Recuando - HP baixo ou cercado",
        };
      }
    }

    // 2. Tentar usar skill (priorizando utilidade)
    const skillEval = selectBestSkill(unit, availableSkills, units, profile);
    if (skillEval && skillEval.canUse) {
      return {
        type: "SKILL",
        unitId: unit.id,
        skillCode: skillEval.skill.code,
        targetId: skillEval.bestTarget!.id,
        reason: `Tático: ${skillEval.reason}`,
      };
    }

    // 3. Avaliar se vale a pena atacar
    const attackRange = 1;
    const bestTarget = selectBestTarget(unit, units, profile, attackRange);

    console.log(`[AI Tactical] bestTarget: ${bestTarget?.name || "null"}`);

    if (bestTarget) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: bestTarget.posX, y: bestTarget.posY }
      );

      console.log(
        `[AI Tactical] Distância para ${bestTarget.name}: ${distance}, attackRange=${attackRange}`
      );

      // Se está ao alcance, avaliar se é seguro atacar
      if (distance <= attackRange) {
        // Verificar quantos inimigos podem contra-atacar
        const threatsNearby = countThreatsAtPosition(
          { x: unit.posX, y: unit.posY },
          enemies,
          attackRange
        );

        // Usar self-assessment para decisão mais informada
        const hpPercent =
          selfAssessment?.hpPercent ?? unit.currentHp / unit.maxHp;
        const hasProtection =
          selfAssessment?.hasPhysicalProtection ||
          selfAssessment?.hasMagicalProtection;

        console.log(
          `[AI Tactical] Ao alcance! threatsNearby=${threatsNearby}, hpPercent=${hpPercent}, hasProtection=${hasProtection}`
        );

        // Só atacar se tem ações disponíveis
        if (!canAttack) {
          console.log(`[AI Tactical] Não tem ações disponíveis para atacar`);
        } else if (threatsNearby <= 2 || hpPercent > 0.5 || hasProtection) {
          return {
            type: "ATTACK",
            unitId: unit.id,
            targetId: bestTarget.id,
            reason: `Tático: Atacar ${bestTarget.name} (situação favorável)`,
          };
        }
      }

      // Se não está ao alcance mas é seguro aproximar
      if (movesRemaining > 0) {
        console.log(`[AI Tactical] Não ao alcance, tentando aproximar...`);
        // Avaliar posição destino
        const moveTarget = findBestMoveTowards(
          unit,
          { x: bestTarget.posX, y: bestTarget.posY },
          movesRemaining,
          gridSize.width,
          gridSize.height,
          units,
          obstacles
        );

        if (moveTarget) {
          const threatsAtDestination = countThreatsAtPosition(
            moveTarget,
            enemies,
            attackRange
          );

          console.log(
            `[AI Tactical] moveTarget=(${moveTarget.x}, ${moveTarget.y}), threatsAtDestination=${threatsAtDestination}`
          );

          // Só mover se destino não for muito perigoso
          if (threatsAtDestination <= 2) {
            return {
              type: "MOVE",
              unitId: unit.id,
              targetPosition: moveTarget,
              reason: `Tático: Aproximar de ${bestTarget.name}`,
            };
          } else {
            console.log(`[AI Tactical] Destino muito perigoso, não movendo`);
          }
        } else {
          console.log(`[AI Tactical] findBestMoveTowards retornou null`);
        }
      }
    }

    // 4. Se não há boas opções ofensivas, manter posição ou reposicionar
    const nearestEnemy = findNearestEnemy(unit, units);
    console.log(
      `[AI Tactical] Seção 4: nearestEnemy=${
        nearestEnemy?.name || "null"
      }, movesRemaining=${movesRemaining}`
    );

    if (nearestEnemy && movesRemaining > 0) {
      const currentDistance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: nearestEnemy.posX, y: nearestEnemy.posY }
      );

      console.log(`[AI Tactical] currentDistance=${currentDistance}`);

      // Se muito longe, aproximar um pouco
      if (currentDistance > 3) {
        const moveTarget = findBestMoveTowards(
          unit,
          { x: nearestEnemy.posX, y: nearestEnemy.posY },
          Math.min(movesRemaining, 2), // Mover com cautela
          gridSize.width,
          gridSize.height,
          units,
          obstacles
        );

        if (moveTarget) {
          return {
            type: "MOVE",
            unitId: unit.id,
            targetPosition: moveTarget,
            reason: "Tático: Reposicionando cautelosamente",
          };
        }
      }
    }

    // 5. Nenhum inimigo visível - EXPLORAR o mapa
    if (enemies.length === 0 && movesRemaining > 0) {
      console.log(`[AI Tactical] Nenhum inimigo visível - explorando mapa`);

      // Mover em direção ao centro do mapa para aumentar chances de encontrar inimigos
      const centerX = Math.floor(gridSize.width / 2);
      const centerY = Math.floor(gridSize.height / 2);

      const moveTarget = findBestMoveTowards(
        unit,
        { x: centerX, y: centerY },
        movesRemaining,
        gridSize.width,
        gridSize.height,
        units,
        obstacles
      );

      if (moveTarget) {
        return {
          type: "MOVE",
          unitId: unit.id,
          targetPosition: moveTarget,
          reason: "Tático: Explorando - buscando inimigos",
        };
      }
    }

    // 6. Passar turno se não há boa ação
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Tático: Esperando melhor oportunidade",
    };
  } catch (error) {
    // Fallback seguro em caso de erro
    console.error(`[AI Tactical] Erro no comportamento: ${error}`);
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Tático: Fallback por erro",
    };
  }
}
