// server/src/modules/abilities/executors/skills/dodge.skill.ts
// DODGE (Esquiva) - Aumenta chance de esquiva até próximo turno

import type {
  AbilityDefinition,
  AbilityExecutionResult,
} from "@boundless/shared/types/ability.types";
import type { BattleUnit } from "@boundless/shared/types/battle.types";
import {
  scanConditionsForAction,
  applyConditionScanResult,
  applyConditionToUnit,
} from "../../../conditions/conditions";

/**
 * DODGE (Esquiva): Aumenta chance de esquiva até próximo turno
 */
export function executeDodge(
  caster: BattleUnit,
  _target: BattleUnit | null,
  _allUnits: BattleUnit[],
  _skill: AbilityDefinition
): AbilityExecutionResult {
  const scan = scanConditionsForAction(caster.conditions, "DODGE");
  if (!scan.canPerform) {
    return { success: false, error: scan.blockReason };
  }

  // Aplicar condições
  caster.conditions = applyConditionScanResult(caster.conditions, scan);

  // Aplicar condição DODGING
  applyConditionToUnit(caster, "DODGING");

  return {
    success: true,
    conditionApplied: "DODGING",
  };
}
