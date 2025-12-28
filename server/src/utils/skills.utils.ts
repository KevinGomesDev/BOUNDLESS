// src/utils/skills.utils.ts
import { prisma } from "../lib/prisma";
import { SKILL_DEFINITIONS } from "../data/skills";
import { CLASS_DEFINITIONS } from "../data/classes";
import {
  SkillCategory,
  SkillCostTier,
  COST_VALUES,
  RANGE_VALUES,
  RangeType,
  TurnType,
  ResourceType,
} from "../types";
import { spendResources } from "./turn.utils";

/**
 * Obtém todas as habilidades de uma classe
 */
export function getClassSkills(classId: string) {
  const classDef = CLASS_DEFINITIONS[classId];
  if (!classDef) {
    return [];
  }
  return classDef.skills;
}

/**
 * Obtém detalhes completos de uma habilidade
 */
export function getSkillDefinition(skillId: string) {
  return SKILL_DEFINITIONS[skillId];
}

/**
 * Calcula o custo base de uma habilidade
 */
export function calculateBaseCost(costTier: SkillCostTier | undefined): number {
  if (!costTier) return 0;
  return COST_VALUES[costTier] || 0;
}

/**
 * Calcula o custo com escalada (dobrado a cada uso na mesma batalha)
 */
export function calculateEscaledCost(
  baseCost: number,
  usageCount: number
): number {
  if (baseCost === 0) return 0;
  // Primeira vez: baseCost
  // Segunda vez: baseCost * 2
  // Terceira vez: baseCost * 2 * 2 = baseCost * 4
  // Etc.
  return baseCost * Math.pow(2, usageCount);
}

/**
 * Obtém o alcance em quadrados de uma habilidade
 */
export function getSkillRange(rangeType: string | undefined): number {
  if (!rangeType) return 0;
  return RANGE_VALUES[rangeType as RangeType] || 0;
}

/**
 * Valida se uma habilidade pode ser usada
 */
export async function validateSkillUsage(
  unitId: string,
  skillId: string,
  playerId: string,
  usageCountThisBattle: number = 0
): Promise<{
  valid: boolean;
  reason?: string;
  cost?: number;
  resourceType?: ResourceType;
}> {
  // Busca a unidade
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit) {
    return { valid: false, reason: "Unidade não encontrada" };
  }

  if (unit.ownerId !== playerId) {
    return { valid: false, reason: "Você não é dono desta unidade" };
  }

  // Busca a habilidade
  const skill = SKILL_DEFINITIONS[skillId];
  if (!skill) {
    return { valid: false, reason: "Habilidade não encontrada" };
  }

  // Se é passiva, sempre pode ser usada (já está ativa)
  if (skill.category === "PASSIVA") {
    return {
      valid: true,
      cost: 0,
    };
  }

  // Se é ativa ou reativa, verifica custo
  if (!skill.costTier) {
    // Sem custo
    return {
      valid: true,
      cost: 0,
    };
  }

  // Calcula custo escalado
  const baseCost = calculateBaseCost(skill.costTier);
  const escalatedCost = calculateEscaledCost(baseCost, usageCountThisBattle);

  // Obtém a classe da unidade para saber qual recurso é necessário
  if (!unit.heroClass) {
    return {
      valid: false,
      reason: "Unidade não possui classe definida",
    };
  }

  const classDef = CLASS_DEFINITIONS[unit.heroClass];
  if (!classDef) {
    return {
      valid: false,
      reason: "Classe não encontrada",
    };
  }

  const resourceType = classDef.resourceUsed;

  // Verifica se jogador tem recursos suficientes
  const player = await prisma.matchPlayer.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    return {
      valid: false,
      reason: "Jogador não encontrado",
    };
  }

  const playerResources = JSON.parse(player.resources);
  const availableAmount = playerResources[resourceType.toLowerCase()] || 0;

  if (availableAmount < escalatedCost) {
    return {
      valid: false,
      reason: `Recursos insuficientes. Disponível: ${availableAmount} ${resourceType}, Necessário: ${escalatedCost}`,
      cost: escalatedCost,
      resourceType,
    };
  }

  return {
    valid: true,
    cost: escalatedCost,
    resourceType,
  };
}

/**
 * Usa uma habilidade (gasta recurso e registra uso)
 */
export async function useSkill(
  unitId: string,
  skillId: string,
  playerId: string,
  usageCountThisBattle: number = 0
): Promise<{
  success: boolean;
  message: string;
  cost?: number;
  resourceType?: ResourceType;
}> {
  // Valida uso
  const validation = await validateSkillUsage(
    unitId,
    skillId,
    playerId,
    usageCountThisBattle
  );

  if (!validation.valid) {
    return {
      success: false,
      message: validation.reason || "Habilidade não pode ser usada",
    };
  }

  const skill = SKILL_DEFINITIONS[skillId];
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
  });

  if (!unit || !unit.heroClass) {
    return {
      success: false,
      message: "Dados da unidade não encontrados",
    };
  }

  const classDef = CLASS_DEFINITIONS[unit.heroClass];
  const resourceType = classDef.resourceUsed;

  // Se tem custo, gasta o recurso
  if (validation.cost && validation.cost > 0) {
    try {
      const spendData: any = {};
      spendData[resourceType.toLowerCase()] = validation.cost;
      await spendResources(playerId, spendData);
    } catch (error) {
      return {
        success: false,
        message: `Erro ao gastar ${resourceType}`,
      };
    }
  }

  return {
    success: true,
    message: `Habilidade "${skill.name}" usada com sucesso!`,
    cost: validation.cost,
    resourceType,
  };
}

/**
 * Obtém todas as informações de uma habilidade de forma detalhada
 */
export async function getSkillInfo(
  skillId: string,
  unitId: string,
  playerId: string,
  usageCountThisBattle: number = 0
): Promise<{
  skill: any;
  isAvailable: boolean;
  canUse: boolean;
  cost: number;
  resourceType?: ResourceType;
  reason?: string;
}> {
  const skill = SKILL_DEFINITIONS[skillId];

  if (!skill) {
    return {
      skill: null,
      isAvailable: false,
      canUse: false,
      cost: 0,
      reason: "Habilidade não encontrada",
    };
  }

  const validation = await validateSkillUsage(
    unitId,
    skillId,
    playerId,
    usageCountThisBattle
  );

  return {
    skill,
    isAvailable: true,
    canUse: validation.valid,
    cost: validation.cost || 0,
    resourceType: validation.resourceType,
    reason: validation.reason,
  };
}

/**
 * Lista todas as classes disponíveis com suas habilidades
 */
export function listAllClasses() {
  return Object.values(CLASS_DEFINITIONS).map((classDef) => ({
    id: classDef.id,
    name: classDef.name,
    archetype: classDef.archetype,
    description: classDef.description,
    resourceUsed: classDef.resourceUsed,
    skillCount: classDef.skills.length,
    skills: classDef.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      costTier: skill.costTier,
      baseCost: skill.costTier ? COST_VALUES[skill.costTier] : 0,
      range: skill.range,
      rangeSquares: skill.range ? RANGE_VALUES[skill.range as RangeType] : 0,
    })),
  }));
}

/**
 * Obtém detalhes de uma classe específica
 */
export function getClassInfo(classId: string) {
  const classDef = CLASS_DEFINITIONS[classId];

  if (!classDef) {
    return null;
  }

  return {
    id: classDef.id,
    name: classDef.name,
    archetype: classDef.archetype,
    description: classDef.description,
    resourceUsed: classDef.resourceUsed,
    skills: classDef.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: skill.category,
      costTier: skill.costTier,
      baseCost: skill.costTier ? COST_VALUES[skill.costTier] : 0,
      range: skill.range,
      rangeSquares: skill.range ? RANGE_VALUES[skill.range as RangeType] : 0,
    })),
  };
}
