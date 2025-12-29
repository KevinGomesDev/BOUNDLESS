import React, { useState, useEffect } from "react";
import type { Territory } from "../types/map.types";
import { socketService } from "../../../services/socket.service";

export interface TerritoryArea {
  index: number;
  structure: {
    id: string;
    type: string;
    name: string;
    level?: number;
  } | null;
}

export interface AvailableStructure {
  id: string;
  type: string;
  name: string;
  description?: string;
  cost?: Record<string, number>;
  slots?: number;
}

interface TerritoryModalProps {
  territory: Territory;
  playerId: string | null;
  matchId: string;
  onClose: () => void;
  onBuildSuccess?: () => void;
}

/**
 * TerritoryModal - Modal de visualização de Território
 * Exibe as Áreas do território e permite construir arrastando da sidebar
 */
export const TerritoryModal: React.FC<TerritoryModalProps> = ({
  territory,
  playerId,
  matchId,
  onClose,
  onBuildSuccess,
}) => {
  const [areas, setAreas] = useState<TerritoryArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOverArea, setDragOverArea] = useState<number | null>(null);
  const [buildingInProgress, setBuildingInProgress] = useState(false);

  // Gera as áreas baseado em areaSlots do território
  useEffect(() => {
    const generateAreas = () => {
      const areaList: TerritoryArea[] = [];
      for (let i = 0; i < territory.areaSlots; i++) {
        areaList.push({
          index: i,
          structure: null,
        });
      }

      // Se há estruturas existentes, preenche
      if (territory.structures && territory.structures.length > 0) {
        territory.structures.forEach((struct, idx) => {
          if (idx < areaList.length) {
            areaList[idx].structure = {
              id: struct.id,
              type: struct.type || struct.structureType,
              name: struct.name || struct.type,
              level: struct.level,
            };
          }
        });
      }

      setAreas(areaList);
      setIsLoading(false);
    };

    generateAreas();
  }, [territory]);

  // Listener para atualizações de estrutura
  useEffect(() => {
    const handleStructureCreated = (data: {
      structure: any;
      territoryId: string;
    }) => {
      if (data.territoryId === territory.id) {
        // Atualiza a área com a nova estrutura
        setAreas((prev) => {
          const updated = [...prev];
          const emptySlot = updated.findIndex((a) => !a.structure);
          if (emptySlot !== -1) {
            updated[emptySlot].structure = {
              id: data.structure.id,
              type: data.structure.type || data.structure.structureType,
              name: data.structure.name || data.structure.type,
              level: data.structure.level,
            };
          }
          return updated;
        });
        onBuildSuccess?.();
      }
    };

    socketService.on("structure:created", handleStructureCreated);
    return () => {
      socketService.off("structure:created", handleStructureCreated);
    };
  }, [territory.id, onBuildSuccess]);

  const handleDragOver = (e: React.DragEvent, areaIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverArea(areaIndex);
  };

  const handleDragLeave = () => {
    setDragOverArea(null);
  };

  const handleDrop = (e: React.DragEvent, areaIndex: number) => {
    e.preventDefault();
    setDragOverArea(null);

    const area = areas[areaIndex];
    if (area.structure) {
      setError("Esta área já possui uma construção.");
      return;
    }

    const structureType = e.dataTransfer.getData("structureType");
    const structureName = e.dataTransfer.getData("structureName");

    if (!structureType) {
      setError("Estrutura inválida.");
      return;
    }

    if (!playerId || !matchId) {
      setError("Não foi possível identificar jogador ou partida.");
      return;
    }

    // Emitir construção
    setBuildingInProgress(true);
    setError(null);

    const cleanup = () => {
      socketService.off("preparation:build_success", successHandler);
      socketService.off("preparation:build_failed", failHandler);
      socketService.off("error", failHandler);
    };

    const successHandler = () => {
      setBuildingInProgress(false);
      cleanup();
    };

    const failHandler = (data: { message?: string }) => {
      setBuildingInProgress(false);
      setError(data.message || `Falha ao construir ${structureName}`);
      cleanup();
    };

    socketService.on("preparation:build_success", successHandler);
    socketService.on("preparation:build_failed", failHandler);
    socketService.on("error", failHandler);

    socketService.emit("preparation:build_structure", {
      matchId,
      playerId,
      territoryId: territory.id,
      structureType,
      areaIndex, // Opcional: se o servidor suportar slot específico
    });
  };

  const getTerrainColor = (terrain: string) => {
    const colors: Record<string, string> = {
      ICE: "from-blue-200 to-blue-400",
      MOUNTAIN: "from-gray-400 to-gray-600",
      FOREST: "from-green-500 to-green-700",
      PLAINS: "from-green-300 to-green-400",
      WASTELAND: "from-amber-600 to-amber-800",
      DESERT: "from-yellow-400 to-orange-500",
      OCEAN: "from-blue-500 to-blue-700",
    };
    return colors[terrain] || "from-slate-500 to-slate-700";
  };

  const getStructureIcon = (type: string) => {
    const icons: Record<string, string> = {
      FARM: "🌾",
      MINE: "⛏️",
      BARRACKS: "🏛️",
      TEMPLE: "⛪",
      TOWER: "🗼",
      WALL: "🧱",
      MARKET: "🏪",
      FORGE: "🔨",
      STABLE: "🐴",
      LIBRARY: "📚",
    };
    return icons[type.toUpperCase()] || "🏗️";
  };

  return (
    <div className="absolute inset-0 pt-16 pr-80 z-25 flex items-center justify-center pointer-events-auto">
      {/* Backdrop escuro sobre o mapa */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-citadel-granite to-citadel-carved border-4 border-metal-iron rounded-xl shadow-stone-raised max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Textura */}
        <div className="absolute inset-0 bg-stone-texture opacity-30 pointer-events-none rounded-xl" />

        {/* Header */}
        <div className="relative bg-gradient-to-r from-citadel-carved via-citadel-granite to-citadel-carved border-b-2 border-metal-rust/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Ícone do terreno */}
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getTerrainColor(
                  territory.terrainType
                )} border-2 border-metal-iron shadow-stone-inset flex items-center justify-center`}
              >
                <span className="text-2xl">
                  {territory.isCapital ? "👑" : "🏔️"}
                </span>
              </div>
              <div>
                <h2
                  className="text-parchment-light font-bold text-xl tracking-wider"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Território #{territory.mapIndex}
                </h2>
                <div className="flex items-center gap-3 text-parchment-aged text-sm">
                  <span>{territory.terrainType}</span>
                  <span>•</span>
                  <span>{territory.size}</span>
                  <span>•</span>
                  <span>
                    {territory.usedSlots}/{territory.areaSlots} áreas ocupadas
                  </span>
                </div>
              </div>
            </div>

            {territory.isCapital && (
              <div className="bg-metal-gold/20 border-2 border-metal-gold rounded-lg px-4 py-2">
                <span className="text-metal-gold font-bold">👑 Capital</span>
              </div>
            )}
          </div>
        </div>

        {/* Content - Áreas */}
        <div className="relative p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-war-crimson border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-war-blood/30 border-2 border-war-crimson rounded-lg">
                  <p className="text-war-ember text-sm">{error}</p>
                </div>
              )}

              {buildingInProgress && (
                <div className="mb-4 p-3 bg-metal-gold/20 border-2 border-metal-gold rounded-lg flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-metal-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-metal-gold text-sm">Construindo...</p>
                </div>
              )}

              <div className="mb-4">
                <h3
                  className="text-parchment-light font-bold text-sm tracking-wider mb-3"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ÁREAS DO TERRITÓRIO
                </h3>
                <p className="text-parchment-aged text-xs mb-4">
                  Arraste uma construção da barra lateral para uma área vazia.
                </p>
              </div>

              {/* Grid de Áreas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {areas.map((area) => (
                  <div
                    key={area.index}
                    onDragOver={(e) => handleDragOver(e, area.index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, area.index)}
                    className={`relative aspect-square rounded-lg border-3 transition-all duration-200 flex flex-col items-center justify-center p-3 ${
                      area.structure
                        ? "bg-citadel-carved border-metal-bronze shadow-stone-inset"
                        : dragOverArea === area.index
                        ? "bg-war-crimson/30 border-war-crimson border-dashed scale-105"
                        : "bg-citadel-slate/50 border-metal-iron/50 border-dashed hover:border-metal-iron hover:bg-citadel-slate/70"
                    }`}
                  >
                    {area.structure ? (
                      <>
                        <span className="text-3xl mb-2">
                          {getStructureIcon(area.structure.type)}
                        </span>
                        <span className="text-parchment-light font-semibold text-xs text-center">
                          {area.structure.name}
                        </span>
                        {area.structure.level && (
                          <span className="text-parchment-aged text-[10px]">
                            Nível {area.structure.level}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-2xl text-parchment-dark/40 mb-1">
                          {dragOverArea === area.index ? "⬇️" : "➕"}
                        </span>
                        <span className="text-parchment-dark/60 text-xs text-center">
                          Área {area.index + 1}
                        </span>
                        <span className="text-parchment-dark/40 text-[10px]">
                          {dragOverArea === area.index ? "Solte aqui" : "Vazia"}
                        </span>
                      </>
                    )}

                    {/* Número do slot */}
                    <div className="absolute top-1 right-1 w-5 h-5 bg-citadel-obsidian/60 rounded text-parchment-aged text-[10px] flex items-center justify-center">
                      {area.index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="relative bg-citadel-carved border-t-2 border-metal-rust/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-parchment-aged text-xs">
              <span className="text-parchment-light font-bold">Dica:</span>{" "}
              Arraste construções da sidebar direita para as áreas vazias.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-citadel-slate border-2 border-metal-iron rounded-lg text-parchment-light font-semibold text-sm hover:bg-citadel-weathered transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
