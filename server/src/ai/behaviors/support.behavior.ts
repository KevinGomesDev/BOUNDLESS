// server/src/ai/behaviors/support.behavior.ts
// Comportamento Support: Prioriza curar e buffar aliados

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
  getAllies,
  findNearestAlly,
  findNearestEnemy,
  selectBestAllyForSupport,
  isUnitInDanger,
} from "../core/target-selection";
import {
  selectBestSkill,
  getValidTargetsForSkill,
  getSkillEffectiveRange,
} from "../core/skill-evaluator";
import { BattleUnit } from "../../../../shared/types/battle.types";

/**
 * Comportamento Support
 * - Prioriza cura e buffs
 * - Fica perto dos aliados
 * - Evita combate direto
 * - Foge de inimigos
 * - Considera próprio estado para auto-cura
 */
export function makeSupportDecision(
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
    const allies = getAllies(unit, units);

    // Verificar se pode atacar (tem ações disponíveis)
    const canAttack = (actionsRemaining ?? unit.actionsLeft ?? 0) > 0;

    // 1. Verificar se PRÓPRIO HP está baixo - suporte se cura primeiro se puder
    if (selfAssessment?.isWounded) {
      const selfHealSkills = availableSkills.filter(
        (s) =>
          s.targetType === "SELF" ||
          (s.targetType === "ALLY" && getSkillEffectiveRange(s) === 0)
      );

      if (selfHealSkills.length > 0) {
        return {
          type: "SKILL",
          unitId: unit.id,
          skillCode: selfHealSkills[0].code,
          targetId: unit.id,
          reason: "Support: Auto-cura (HP baixo)",
        };
      }
    }

    // 2. Verificar se está em perigo - suporte SEMPRE foge
    const nearestEnemy = findNearestEnemy(unit, units);
    if (nearestEnemy) {
      const distanceToEnemy = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: nearestEnemy.posX, y: nearestEnemy.posY }
      );

      // Fugir se inimigo está muito perto ou se está em perigo
      const shouldFlee =
        distanceToEnemy <= 2 ||
        selfAssessment?.shouldRetreat ||
        selfAssessment?.isCritical;
      if (shouldFlee && movesRemaining > 0) {
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
            reason: "Support: Fugindo de inimigo próximo",
          };
        }
      }
    }

    // 2. Priorizar skills de cura se aliados precisam
    // Skills de suporte têm targetType ALLY ou SELF
    const healSkills = availableSkills.filter(
      (s) => s.targetType === "ALLY" || s.targetType === "SELF"
    );
    if (healSkills.length > 0) {
      for (const healSkill of healSkills) {
        const validTargets = getValidTargetsForSkill(unit, healSkill, units);
        const needsHealing = validTargets.filter(
          (t) => t.currentHp < t.maxHp * 0.7
        );

        if (needsHealing.length > 0) {
          // Curar o mais necessitado
          needsHealing.sort(
            (a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp
          );
          return {
            type: "SKILL",
            unitId: unit.id,
            skillCode: healSkill.code,
            targetId: needsHealing[0].id,
            reason: `Support: Curando ${needsHealing[0].name}`,
          };
        }
      }
    }

    // 3. Usar outras skills de suporte (buffs)
    const buffSkills = availableSkills.filter(
      (s) =>
        (s.targetType === "ALLY" || s.targetType === "SELF") &&
        s.conditionApplied
    );
    if (buffSkills.length > 0) {
      const skillEval = selectBestSkill(unit, buffSkills, units, profile);
      if (skillEval && skillEval.canUse) {
        return {
          type: "SKILL",
          unitId: unit.id,
          skillCode: skillEval.skill.code,
          targetId: skillEval.bestTarget!.id,
          reason: `Support: Buffando ${skillEval.bestTarget!.name}`,
        };
      }
    }

    // 4. Mover para perto de aliados que podem precisar de suporte
    if (allies.length > 0 && movesRemaining > 0) {
      const allyNeedingSupport = selectBestAllyForSupport(unit, units, 99);
      if (allyNeedingSupport) {
        const distance = manhattanDistance(
          { x: unit.posX, y: unit.posY },
          { x: allyNeedingSupport.posX, y: allyNeedingSupport.posY }
        );

        // Se está longe do aliado que precisa de suporte
        if (distance > 2) {
          const moveTarget = findBestMoveTowards(
            unit,
            { x: allyNeedingSupport.posX, y: allyNeedingSupport.posY },
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
              reason: `Support: Aproximando de ${allyNeedingSupport.name}`,
            };
          }
        }
      }
    }

    // 5. Se não tem o que fazer de suporte, tentar ataque de oportunidade
    if (nearestEnemy && canAttack) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: nearestEnemy.posX, y: nearestEnemy.posY }
      );

      if (distance <= 1) {
        return {
          type: "ATTACK",
          unitId: unit.id,
          targetId: nearestEnemy.id,
          reason: `Support: Ataque de oportunidade em ${nearestEnemy.name}`,
        };
      }
    }

    // 7. Passar turno
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Support: Aguardando aliados precisarem de ajuda",
    };
  } catch (error) {
    // Fallback seguro em caso de erro
    console.error(`[AI Support] Erro no comportamento: ${error}`);
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Support: Fallback por erro",
    };
  }
}
