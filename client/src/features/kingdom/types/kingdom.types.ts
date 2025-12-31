// Kingdom Types
// Re-exports shared types and adds frontend-specific types

// ============ ENUMS (Match Prisma schema) ============

export type Alignment = "BOM" | "MAL" | "NEUTRO";

export type Race =
  | "ABERRACAO"
  | "BESTA"
  | "CELESTIAL"
  | "CONSTRUTO"
  | "DRAGAO"
  | "ELEMENTAL"
  | "FADA"
  | "DIABO"
  | "GIGANTE"
  | "HUMANOIDE"
  | "MONSTRUOSIDADE"
  | "GOSMA"
  | "PLANTA"
  | "MORTO_VIVO"
  | "INSETO";

export type ResourceType =
  | "ore"
  | "supplies"
  | "arcane"
  | "experience"
  | "devotion";

export type UnitCategory =
  | "TROOP"
  | "HERO"
  | "REGENT"
  | "PRISONER"
  | "SUMMON"
  | "MONSTER";

export type TemplateDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type KingdomErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "ACCESS_DENIED"
  | "INVALID_RACE_METADATA"
  | "INVALID_TROOP_TEMPLATES"
  | "TEMPLATE_NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

// ============ BASE INTERFACES ============

export interface BaseAttributes {
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

// ============ KINGDOM ============

export interface Kingdom {
  id: string;
  name: string;
  capitalName: string;
  description?: string;
  alignment: Alignment;
  race: Race;
  raceMetadata?: string;
  locationIndex: number;
  ownerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface KingdomWithRelations extends Kingdom {
  troopTemplates?: TroopTemplate[];
  units?: Unit[];
}

export interface KingdomSummary {
  id: string;
  name: string;
  race: Race;
  alignment: Alignment;
  capitalName: string;
}

// ============ TROOP TEMPLATE ============

export interface TroopTemplate {
  id: string;
  kingdomId: string;
  slotIndex: number;
  name: string;
  description?: string;
  passiveId: string;
  resourceType: ResourceType;
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

export interface CreateTroopTemplateData {
  slotIndex: number;
  name: string;
  description?: string;
  passiveId: string;
  resourceType: ResourceType;
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

// ============ UNIT ============

export interface Unit {
  id: string;
  kingdomId?: string;
  name: string;
  description?: string;
  category: UnitCategory;
  classId?: string;
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
  currentHp: number;
  movesLeft: number;
  actionsLeft: number;
}

// ============ REGENT ============

export interface RegentData {
  name: string;
  description?: string;
  classCode: string;
  combat: number;
  acuity: number;
  focus: number;
  armor: number;
  vitality: number;
}

export interface CreateRegentData {
  name: string;
  classCode: string;
  attributeDistribution: BaseAttributes;
}

// ============ CREATE KINGDOM ============

export interface CreateKingdomData {
  name: string;
  capitalName: string;
  alignment: Alignment;
  race: Race;
  raceMetadata?: string;
  troopTemplates?: CreateTroopTemplateData[];
}

// ============ KINGDOM TEMPLATES ============

export interface KingdomTemplateSummary {
  id: string;
  name: string;
  description: string;
  raceName: string;
  alignmentName: string;
  regentClassName: string;
  difficulty: TemplateDifficulty;
  icon: string;
}

export interface KingdomTemplateDetails {
  id: string;
  name: string;
  capitalName: string;
  description: string;
  alignment: Alignment;
  race: Race;
  raceMetadata?: string;
  regent: RegentData;
  troopTemplates: CreateTroopTemplateData[];
}

// ============ STATIC DATA ============

export interface RaceDefinition {
  id: Race;
  name: string;
  description: string;
  passiveName: string;
  passiveEffect: string;
  color: number;
}

export interface AlignmentDefinition {
  id: Alignment;
  name: string;
  description: string;
  passiveName: string;
  passiveEffect: string;
  color: number;
}

export interface TroopPassiveDefinition {
  id: string;
  name: string;
  description: string;
}

export interface GameClassDefinition {
  id: string;
  code: string;
  name: string;
  archetype: string;
  resourceUsed: string;
  description: string;
}

// ============ FRONTEND STATE ============

export interface KingdomState {
  kingdom: KingdomWithRelations | null;
  kingdoms: KingdomSummary[];
  isLoading: boolean;
  error: string | null;
}

export interface KingdomContextType {
  state: KingdomState;
  createKingdom: (data: CreateKingdomData) => Promise<KingdomWithRelations>;
  createFromTemplate: (templateId: string) => Promise<KingdomWithRelations>;
  loadKingdoms: () => Promise<KingdomSummary[]>;
  selectKingdom: (kingdom: KingdomWithRelations | null) => void;
  clearError: () => void;
}

export type KingdomAction =
  | { type: "SET_KINGDOM"; payload: KingdomWithRelations | null }
  | { type: "SET_KINGDOMS"; payload: KingdomSummary[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };
