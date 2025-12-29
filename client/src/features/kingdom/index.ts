// Kingdom Feature - Public API
export { KingdomProvider, KingdomContext } from "./context/KingdomContext";
export {
  useKingdom,
  useKingdomState,
  useKingdoms,
  useCurrentKingdom,
} from "./hooks/useKingdom";
export { CreateKingdomModal } from "./components";
export type {
  Kingdom,
  KingdomState,
  KingdomContextType,
  KingdomAction,
  CreateKingdomData,
  RegentData,
  TroopTemplateData,
  TroopPassive,
} from "./types/kingdom.types";
