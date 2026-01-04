// server/src/ai/behaviors/aggressive.behavior.ts
// Comportamento Agressivo: Foca em atacar, persegue inimigos

import type { SkillDefinition } from "../../../../shared/types/skills.types";
import type {
  AIDecision,
  AIBattleContext,
  AIProfile,
  AISelfAssessment,
} from "../types/ai.types";
import { manhattanDistance, findBestMoveTowards } from "../core/pathfinding";
import {
  selectBestTarget,
  findNearestEnemy,
  getVisibleEnemies,
  shouldExplore,
  getExplorationTarget,
  canDefeatTarget,
} from "../core/target-selection";
import { selectBestSkill } from "../core/skill-evaluator";
import { canAffordToAttack } from "../core/self-assessment";
import { BattleUnit } from "../../../../shared/types/battle.types";

/**
 * Comportamento Agressivo
 * - Sempre busca atacar
 * - Persegue o inimigo mais próximo ou mais fraco
 * - Usa skills de dano quando possível
 * - Pode considerar recuo se HP muito baixo (via self-assessment)
 * - EXPLORA se não vê nenhum inimigo
 * - CONSIDERA atributos para escolher alvos que pode derrotar
 */
export function makeAggressiveDecision(
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

    // Verificar se pode atacar (tem ações disponíveis)
    const canAttack = (actionsRemaining ?? unit.actionsLeft ?? 0) > 0;

    // 0. Verificar se precisa explorar (nenhum inimigo visível)
    if (shouldExplore(unit, units) && movesRemaining > 0) {
      const explorationTarget = getExplorationTarget(
        unit,
        units,
        gridSize.width,
        gridSize.height
      );
      const moveTarget = findBestMoveTowards(
        unit,
        explorationTarget,
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
          reason: "Agressivo: Explorando em busca de inimigos",
        };
      }
    }

    // 1. Tentar usar skill ofensiva
    const skillEval = selectBestSkill(unit, availableSkills, units, profile);
    if (
      skillEval &&
      skillEval.canUse &&
      skillEval.skill.targetType === "ENEMY"
    ) {
      return {
        type: "SKILL",
        unitId: unit.id,
        skillCode: skillEval.skill.code,
        targetId: skillEval.bestTarget!.id,
        reason: `Agressivo: ${skillEval.reason}`,
      };
    }

    // 2. Encontrar alvo para ataque básico (prioriza alvos que pode derrotar)
    const attackRange = 1; // Ataque básico é adjacente
    const visibleEnemies = getVisibleEnemies(unit, units);

    // Priorizar alvos que podemos derrotar rapidamente
    const defeatable = visibleEnemies.filter((e) =>
      canDefeatTarget(unit, e, 3)
    );
    const bestTarget =
      defeatable.length > 0
        ? selectBestTarget(
            unit,
            [...defeatable, ...units.filter((u) => u.ownerId === unit.ownerId)],
            profile,
            attackRange
          )
        : selectBestTarget(unit, units, profile, attackRange);

    if (bestTarget) {
      const distance = manhattanDistance(
        { x: unit.posX, y: unit.posY },
        { x: bestTarget.posX, y: bestTarget.posY }
      );

      // Se está ao alcance, atacar (verificar se podemos nos dar ao luxo)
      if (distance <= attackRange) {
        // Só atacar se tem ações disponíveis
        if (!canAttack) {
          // Não tem ações, tentar mover para se posicionar melhor
        } else {
          // Se temos self-assessment, verificar se podemos atacar com segurança
          const shouldAttack = selfAssessment
            ? canAffordToAttack(unit, bestTarget, selfAssessment)
            : true;

          if (shouldAttack) {
            return {
              type: "ATTACK",
              unitId: unit.id,
              targetId: bestTarget.id,
              reason: `Agressivo: Atacar ${bestTarget.name} (Combat: ${unit.combat} vs Armor: ${bestTarget.armor})`,
            };
          }
        }
      }

      // Se não está ao alcance, mover em direção
      if (movesRemaining > 0) {
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
          return {
            type: "MOVE",
            unitId: unit.id,
            targetPosition: moveTarget,
            reason: `Agressivo: Perseguir ${bestTarget.name}`,
          };
        }
      }
    }

    // 3. Se não tem alvo específico, ir para o inimigo mais próximo
    const nearestEnemy = findNearestEnemy(unit, units);
    if (nearestEnemy && movesRemaining > 0) {
      const moveTarget = findBestMoveTowards(
        unit,
        { x: nearestEnemy.posX, y: nearestEnemy.posY },
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
          reason: `Agressivo: Avançar para ${nearestEnemy.name}`,
        };
      }
    }

    // 4. Sem ações possíveis, passar turno
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Agressivo: Sem ações disponíveis",
    };
  } catch (error) {
    // Fallback seguro em caso de erro
    console.error(`[AI Aggressive] Erro no comportamento: ${error}`);
    return {
      type: "PASS",
      unitId: unit.id,
      reason: "Agressivo: Fallback por erro",
    };
  }
}
