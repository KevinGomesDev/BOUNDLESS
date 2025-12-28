// src/utils/conquest.utils.ts

import { EVENTS, EventDef } from "../data/events";

// Attributes usable for conquest tests
export const CONQUEST_ATTRIBUTES = [
  "combat",
  "acuity",
  "focus",
  "armor",
  "vitality",
] as const;
export type ConquestAttribute = (typeof CONQUEST_ATTRIBUTES)[number];

// Roll 1D6 (simple)
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Check if event triggers (4+ on 1D6)
export function rollEventTrigger(): { roll: number; triggered: boolean } {
  const roll = rollD6();
  return { roll, triggered: roll >= 4 };
}

// Pick N random unique attributes
export function pickRandomAttributes(count: number): ConquestAttribute[] {
  const shuffled = [...CONQUEST_ATTRIBUTES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, CONQUEST_ATTRIBUTES.length));
}

// Pick a random event
export function pickRandomEvent(): EventDef {
  const idx = Math.floor(Math.random() * EVENTS.length);
  return EVENTS[idx];
}

// Attribute test result
export interface AttributeTestResult {
  attribute: ConquestAttribute;
  roll: number;
  attributeValue: number;
  total: number;
  cd: number;
  success: boolean;
}

// Perform a single attribute test: roll 1D6 + attribute >= CD
export function testAttribute(
  attributeValue: number,
  attribute: ConquestAttribute,
  cd: number = 3
): AttributeTestResult {
  const roll = rollD6();
  const total = roll + attributeValue;
  const success = total >= cd;
  return { attribute, roll, attributeValue, total, cd, success };
}

// Full conquest event result
export interface ConquestEventResult {
  eventTriggered: boolean;
  eventTriggerRoll: number;
  event: EventDef | null;
  attributeTests: AttributeTestResult[];
  overallSuccess: boolean;
  crisisIncrease: number;
}

// Process conquest event flow
// attributes: object with attribute name -> value (from the Hero/Regent leading the conquest)
export function processConquestEvent(
  unitAttributes: Record<ConquestAttribute, number>
): ConquestEventResult {
  // Step 1: Roll to check if event triggers (4+)
  const { roll: eventTriggerRoll, triggered: eventTriggered } =
    rollEventTrigger();

  if (!eventTriggered) {
    return {
      eventTriggered: false,
      eventTriggerRoll,
      event: null,
      attributeTests: [],
      overallSuccess: true, // No event = auto success for conquest
      crisisIncrease: 0,
    };
  }

  // Step 2: Pick random event
  const event = pickRandomEvent();

  // Step 3: Pick 3 random attributes and test them
  const randomAttrs = pickRandomAttributes(3);
  const CD = 3; // Crisis Meter threshold

  const attributeTests: AttributeTestResult[] = randomAttrs.map((attr) =>
    testAttribute(unitAttributes[attr], attr, CD)
  );

  // Count successes
  const successCount = attributeTests.filter((t) => t.success).length;
  const failureCount = attributeTests.length - successCount;

  // Overall success = at least one success? Or majority?
  // Based on rules: "Sucesso aplica efeito, falha aumenta Medidor de Crise"
  // Interpreting: if any test fails, crisis increases by failure count
  const overallSuccess = failureCount === 0;
  const crisisIncrease = failureCount;

  return {
    eventTriggered: true,
    eventTriggerRoll,
    event,
    attributeTests,
    overallSuccess,
    crisisIncrease,
  };
}

// Calculate conquest cost (based on current territory count)
// Cost = number of territories already owned (in minerio)
export function calculateConquestCost(currentTerritoryCount: number): number {
  // Minimum 1 minerio, or current count
  return Math.max(1, currentTerritoryCount);
}

// Validation result
export interface ConquestValidation {
  valid: boolean;
  reason?: string;
  unitCount?: number;
  hasLeader?: boolean;
  cost?: number;
}

// Validate conquest requirements
export function validateConquestRequirements(
  unitCount: number,
  hasHeroOrRegent: boolean,
  playerResources: { minerio: number },
  cost: number
): ConquestValidation {
  // Must have 3+ units in territory
  if (unitCount < 3) {
    return {
      valid: false,
      reason:
        "É necessário pelo menos 3 unidades no território para conquistá-lo.",
      unitCount,
      hasLeader: hasHeroOrRegent,
    };
  }

  // Must have Hero or Regent present
  if (!hasHeroOrRegent) {
    return {
      valid: false,
      reason:
        "É necessário um Herói ou Regente presente para liderar a conquista.",
      unitCount,
      hasLeader: hasHeroOrRegent,
    };
  }

  // Must have enough minerio
  if (playerResources.minerio < cost) {
    return {
      valid: false,
      reason: `Minério insuficiente. Custo: ${cost}, disponível: ${playerResources.minerio}.`,
      unitCount,
      hasLeader: hasHeroOrRegent,
      cost,
    };
  }

  return {
    valid: true,
    unitCount,
    hasLeader: hasHeroOrRegent,
    cost,
  };
}
