// src/data/crisis.ts
// Configurações de sistema de Crise

export enum TributeDecision {
  CONTRIBUIR = "CONTRIBUIR", // Incrementa a pilha
  SABOTAR = "SABOTAR", // Reduz a pilha
  NAOINTERVIER = "NAOINTERVIER", // Não contribui
}

// --- CRISE: MEDIDOR DE CRISE ---
export const CRISIS_METER_START = 1; // MC começa em 1
export const CRISIS_METER_MAX = 15; // Quando chega a 15, crise é acionada
export const CRISIS_METER_TRIGGERED_AT_TURN = 5; // No 5º turno da rodada a crise é revelada
