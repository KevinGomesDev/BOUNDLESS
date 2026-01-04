// server/src/ai/behaviors/ranged.behavior.ts
// Comportamento Ranged: Mantém distância, ataca de longe

import type { SkillDefinition } from "../../../../shared/types/skills.types";
import type {
  AIDecision,
  AIBattleContext,
  AIProfile,
  AISelfAssessment,
} from "../types/ai.types";
import {
  manhattanDistance,
  findBestRetreatPosition,
  findPositionAtRange,
} from "../core/pathfinding";
import { selectBestTarget, findNearestEnemy } from "../core/target-selection";
import { selectBestSkill } from "../core/skill-evaluator";
import { BattleUnit } from "../../../../shared/types/battle.types";

/**
 * Comportamento Ranged
 * - Prioriza ataques à distância
 * - Mantém distância dos inimigos
 * - Foge se inimigos se aproximam
 * - Usa skills de dano ranged
 * - Considera estado próprio para decisões de fuga
 */
export function makeRangedDecision(
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
    const preferredRange = profile.preferredRange ?? 3;

    // Verificar se pode atacar (tem ações disponíveis)
    const canAttack = (actionsRemaining ?? unit.actionsLeft ?? 0) > 0;

    // 1. Verificar se inimigos estão muito perto
    const nearestEnemy = findNearestEnemy(unit, units);
    if (nearestEnemy) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: nearestEnemy.posX, y: nearestEnemy.posY }
      );

      // Se inimigo está muito perto ou em perigo, recuar primeiro
      const shouldRetreat =
        selfAssessment?.shouldRetreat || selfAssessment?.isCritical;
      if ((distance < preferredRange || shouldRetreat) && movesRemaining > 0) {
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
            reason: "Ranged: Recuando para manter distância",
          };
        }
      }
    }

    // 2. Tentar usar skill ranged
    const rangedSkills = availableSkills.filter(
      (s) => s.range === "RANGED" || (s.rangeValue && s.rangeValue > 1)
    );

    if (rangedSkills.length > 0) {
      const skillEval = selectBestSkill(unit, rangedSkills, units, profile);
      if (skillEval && skillEval.canUse) {
        return {
          type: "SKILL",
          unitId: unit.id,
          skillCode: skillEval.skill.code,
          targetId: skillEval.bestTarget!.id,
          reason: `Ranged: ${skillEval.reason}`,
        };
      }
    }

    // 3. Tentar qualquer skill disponível
    const skillEval = selectBestSkill(unit, availableSkills, units, profile);
    if (skillEval && skillEval.canUse) {
      return {
        type: "SKILL",
        unitId: unit.id,
        skillCode: skillEval.skill.code,
        targetId: skillEval.bestTarget!.id,
        reason: `Ranged: ${skillEval.reason}`,
      };
    }

    // 4. Se não tem skills ranged, verificar ataque básico
    const attackRange = 1;
    const bestTarget = selectBestTarget(unit, units, profile, attackRange);

    if (bestTarget) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: bestTarget.posX, y: bestTarget.posY }
      );

      // Atacar se está ao alcance e tem ações
      if (distance <= attackRange && canAttack) {
        return {
          type: "ATTACK",
          unitId: unit.id,
          targetId: bestTarget.id,
          reason: `Ranged: Atacar ${bestTarget.name} (sem opção ranged)`,
        };
      }
    }

    // 5. Mover para posição ideal de range
    if (nearestEnemy && movesRemaining > 0) {
      const idealPos = findPositionAtRange(
        unit,
        nearestEnemy,
        preferredRange,
        movesRemaining,
        gridSize.width,
        gridSize.height,
        units,
        obstacles
      );

      if (idealPos) {
        return {
          type: "MOVE",
          unitId: unit.id,
          targetPosition: idealPos,
          reason: "Ranged: Posicionando para ataque à distância",
        };
      }
    }

    // 6. Passar turno
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Ranged: Mantendo posição",
    };
  } catch (error) {
    // Fallback seguro em caso de erro
    console.error(`[AI Ranged] Erro no comportamento: ${error}`);
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Ranged: Fallback por erro",
    };
  }
}
