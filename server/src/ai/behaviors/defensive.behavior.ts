// server/src/ai/behaviors/defensive.behavior.ts
// Comportamento Defensivo: Protege posição, contra-ataca

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
  findNearestEnemy,
  getAllies,
  countThreatsAtPosition,
} from "../core/target-selection";
import { selectBestSkill } from "../core/skill-evaluator";
import { BattleUnit } from "../../../../shared/types/battle.types";

/**
 * Comportamento Defensivo
 * - Não avança ativamente
 * - Contra-ataca quando atacado
 * - Protege aliados fracos
 * - Usa skills defensivas/de proteção
 * - Considera proteções e último tipo de dano recebido
 */
export function makeDefensiveDecision(
  unit: BattleUnit,
  context: AIBattleContext & { selfAssessment?: AISelfAssessment },
  profile: AIProfile,
  availableSkills: SkillDefinition[]
): AIDecision {
  try {
    const { units, obstacles, gridSize, movesRemaining, selfAssessment } =
      context;
    const enemies = units.filter(
      (u) => u.isAlive && u.ownerId !== unit.ownerId
    );
    const allies = getAllies(unit, units);

    // Usar self-assessment se disponível, senão calcular manualmente
    const hpPercentage =
      selfAssessment?.hpPercent ?? unit.currentHp / unit.maxHp;
    const isCritical = selfAssessment?.isCritical ?? hpPercentage <= 0.25;
    const shouldRetreat =
      selfAssessment?.shouldRetreat ?? hpPercentage <= profile.retreatThreshold;

    // 1. Verificar se HP está crítico - recuar
    if (shouldRetreat && movesRemaining > 0) {
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
          reason: "Defensivo: Recuando - HP crítico",
        };
      }
    }

    // 2. Priorizar skills defensivas baseado no último tipo de dano
    const selfBuffSkills = availableSkills.filter(
      (s) =>
        (s.targetType === "SELF" || s.targetType === "ALLY") &&
        s.conditionApplied
    );
    if (selfBuffSkills.length > 0 && hpPercentage < 0.7) {
      // Usar self-assessment para escolher a skill certa
      if (selfAssessment) {
        // Se recebeu dano físico, priorizar proteção física
        if (
          selfAssessment.lastDamageType === "FISICO" &&
          !selfAssessment.hasPhysicalProtection
        ) {
          const physicalBuffs = selfBuffSkills.filter(
            (s) =>
              s.code.toLowerCase().includes("armor") ||
              s.code.toLowerCase().includes("physical") ||
              s.code.toLowerCase().includes("shield")
          );
          if (physicalBuffs.length > 0) {
            return {
              type: "SKILL",
              unitId: unit.id,
              skillCode: physicalBuffs[0].code,
              targetId: unit.id,
              reason: "Defensivo: Proteção física (baseado em último dano)",
            };
          }
        }
        // Se recebeu dano mágico, priorizar proteção mágica
        if (
          selfAssessment.lastDamageType === "MAGICO" &&
          !selfAssessment.hasMagicalProtection
        ) {
          const magicalBuffs = selfBuffSkills.filter(
            (s) =>
              s.code.toLowerCase().includes("magic") ||
              s.code.toLowerCase().includes("barrier") ||
              s.code.toLowerCase().includes("ward")
          );
          if (magicalBuffs.length > 0) {
            return {
              type: "SKILL",
              unitId: unit.id,
              skillCode: magicalBuffs[0].code,
              targetId: unit.id,
              reason: "Defensivo: Proteção mágica (baseado em último dano)",
            };
          }
        }
      }

      // Fallback: usar qualquer buff disponível
      const skillEval = selectBestSkill(unit, selfBuffSkills, units, profile);
      if (skillEval && skillEval.canUse) {
        return {
          type: "SKILL",
          unitId: unit.id,
          skillCode: skillEval.skill.code,
          targetId: unit.id,
          reason: "Defensivo: Usando buff defensivo",
        };
      }
    }

    // 3. Contra-atacar inimigos adjacentes
    const attackRange = 1;
    const adjacentEnemies = enemies.filter(
      (e) =>
        manhattanDistance(
          { x: unit.posX, y: unit.posY },
          { x: e.posX, y: e.posY }
        ) <= attackRange
    );

    if (adjacentEnemies.length > 0) {
      // Atacar o inimigo adjacente mais fraco
      adjacentEnemies.sort(
        (a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp
      );
      const target = adjacentEnemies[0];

      // Tentar skill primeiro
      const skillEval = selectBestSkill(unit, availableSkills, units, profile);
      if (
        skillEval &&
        skillEval.canUse &&
        skillEval.bestTarget?.id === target.id
      ) {
        return {
          type: "SKILL",
          unitId: unit.id,
          skillCode: skillEval.skill.code,
          targetId: target.id,
          reason: `Defensivo: Contra-ataque com skill em ${target.name}`,
        };
      }

      return {
        type: "ATTACK",
        unitId: unit.id,
        targetId: target.id,
        reason: `Defensivo: Contra-atacando ${target.name}`,
      };
    }

    // 4. Proteger aliado fraco - mover para perto dele
    if (allies.length > 0 && movesRemaining > 0) {
      const weakAlly = allies.find((a) => a.currentHp / a.maxHp < 0.5);
      if (weakAlly) {
        const distance = manhattanDistance(
          { x: unit.posX, y: unit.posY },
          { x: weakAlly.posX, y: weakAlly.posY }
        );

        if (distance > 1) {
          const moveTarget = findBestMoveTowards(
            unit,
            { x: weakAlly.posX, y: weakAlly.posY },
            Math.min(movesRemaining, 2), // Não avançar muito
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
              reason: `Defensivo: Protegendo ${weakAlly.name}`,
            };
          }
        }
      }
    }

    // 5. Se inimigo está se aproximando, preparar posição
    const nearestEnemy = findNearestEnemy(unit, units);
    if (nearestEnemy) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: nearestEnemy.posX, y: nearestEnemy.posY }
      );

      // Inimigo está se aproximando (distância média)
      // Manter posição ou ajustar levemente
      if (distance <= 3 && distance > 1 && movesRemaining > 0) {
        // Verificar se posição atual é boa
        const threatsHere = countThreatsAtPosition(
          { x: unit.posX, y: unit.posY },
          enemies,
          2
        );

        // Se muitos inimigos por perto, considerar recuar um pouco
        if (threatsHere >= 2) {
          const retreatPos = findBestRetreatPosition(
            unit,
            enemies,
            1, // Só um passo
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
              reason: "Defensivo: Ajustando posição defensiva",
            };
          }
        }
      }
    }

    // 6. Manter posição
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Defensivo: Mantendo posição defensiva",
    };
  } catch (error) {
    // Fallback seguro em caso de erro
    console.error(`[AI Defensive] Erro no comportamento: ${error}`);
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Defensivo: Fallback por erro",
    };
  }
}
