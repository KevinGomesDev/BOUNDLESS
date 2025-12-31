import { useContext, useCallback, useState } from "react";
import { KingdomContext } from "../context/KingdomContext";
import { kingdomApi, kingdomStaticApi } from "../api";
import type {
  KingdomWithRelations,
  CreateTroopTemplateData,
  RaceDefinition,
  AlignmentDefinition,
  TroopPassiveDefinition,
  GameClassDefinition,
} from "../types/kingdom.types";

// ============ MAIN HOOK ============

export function useKingdom() {
  const context = useContext(KingdomContext);

  if (!context) {
    throw new Error("useKingdom deve ser usado dentro de KingdomProvider");
  }

  return {
    // Métodos do contexto
    createKingdom: context.createKingdom,
    createFromTemplate: context.createFromTemplate,
    loadKingdoms: context.loadKingdoms,
    selectKingdom: context.selectKingdom,
    clearError: context.clearError,

    // Estado
    kingdoms: context.state.kingdoms,
    currentKingdom: context.state.kingdom,
    isLoading: context.state.isLoading,
    error: context.state.error,

    // Acesso ao state completo
    state: context.state,
  };
}

// ============ STATE HOOKS ============

export function useKingdomState() {
  const { state } = useKingdom();
  return state;
}

export function useKingdoms() {
  const { state } = useKingdom();
  return state.kingdoms;
}

export function useCurrentKingdom() {
  const { state } = useKingdom();
  return state.kingdom;
}

// ============ KINGDOM DETAILS HOOK ============

export function useKingdomDetails(kingdomId: string | null) {
  const [kingdom, setKingdom] = useState<KingdomWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!kingdomId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await kingdomApi.getDetails(kingdomId);
      if (!response.success) {
        throw new Error(response.error);
      }
      setKingdom(response.data || null);
      return response.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar detalhes";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [kingdomId]);

  const updateTroopTemplates = useCallback(
    async (templates: CreateTroopTemplateData[]) => {
      if (!kingdomId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const response = await kingdomApi.setTroopTemplates(
          kingdomId,
          templates
        );
        if (!response.success) {
          throw new Error(response.error);
        }
        setKingdom(response.data || null);
        return response.data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar tropas";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [kingdomId]
  );

  return {
    kingdom,
    isLoading,
    error,
    loadDetails,
    updateTroopTemplates,
  };
}

// ============ STATIC DATA HOOK ============

interface StaticDataState {
  races: RaceDefinition[];
  alignments: AlignmentDefinition[];
  passives: TroopPassiveDefinition[];
  classes: GameClassDefinition[];
  isLoading: boolean;
  error: string | null;
}

export function useKingdomStaticData() {
  const [data, setData] = useState<StaticDataState>({
    races: [],
    alignments: [],
    passives: [],
    classes: [],
    isLoading: false,
    error: null,
  });

  const loadAll = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await kingdomStaticApi.loadAll();
      setData({
        ...result,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar dados";
      setData((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  return {
    ...data,
    loadAll,
  };
}

// ============ TEMPLATES HOOK ============

import type {
  KingdomTemplateSummary,
  KingdomTemplateDetails,
} from "../types/kingdom.types";

interface TemplatesState {
  templates: KingdomTemplateSummary[];
  selectedTemplate: KingdomTemplateDetails | null;
  isLoading: boolean;
  error: string | null;
}

export function useKingdomTemplates() {
  const [state, setState] = useState<TemplatesState>({
    templates: [],
    selectedTemplate: null,
    isLoading: false,
    error: null,
  });

  const loadTemplates = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await kingdomApi.listTemplates();
      if (!response.success) {
        throw new Error(response.error);
      }
      setState((prev) => ({
        ...prev,
        templates: response.data?.templates || [],
        isLoading: false,
      }));
      return response.data?.templates || [];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar templates";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return [];
    }
  }, []);

  const loadTemplateDetails = useCallback(async (templateId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await kingdomApi.getTemplate(templateId);
      if (!response.success) {
        throw new Error(response.error);
      }
      setState((prev) => ({
        ...prev,
        selectedTemplate: response.data?.template || null,
        isLoading: false,
      }));
      return response.data?.template || null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar template";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  const clearSelectedTemplate = useCallback(() => {
    setState((prev) => ({ ...prev, selectedTemplate: null }));
  }, []);

  return {
    ...state,
    loadTemplates,
    loadTemplateDetails,
    clearSelectedTemplate,
  };
}
